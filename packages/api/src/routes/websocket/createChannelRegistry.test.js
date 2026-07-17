/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { jest } from '@jest/globals';
import { ConfigError } from '@lowdefy/errors';

const mockPrepareChannel = jest.fn();
jest.unstable_mockModule('./prepareChannel.js', () => ({
  default: mockPrepareChannel,
}));

let createChannelRegistry;

beforeAll(async () => {
  ({ default: createChannelRegistry } = await import('./createChannelRegistry.js'));
});

function createTestContext() {
  return {
    logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn() },
    handleError: jest.fn(),
    user: { sub: 'user-1' },
  };
}

function createSubscriber(id) {
  return { id, subscriptions: new Map(), send: jest.fn() };
}

function sentFrames(subscriber) {
  return subscriber.send.mock.calls.map(([message]) => JSON.parse(message));
}

// Uses the resolver and websocket properties returned by mockPrepareChannel.
// Properties default to the subscription payload so tests control channel
// identity through the payload they subscribe with.
function mockPrepare({ resolver, connectionProperties = null, properties, tenant = null } = {}) {
  mockPrepareChannel.mockImplementation(async (context, { websocketId, payload }) => ({
    connectionProperties,
    properties: properties ?? payload ?? {},
    tenant,
    websocketConfig: { websocketId, type: 'TestSource', '~k': 'websockets.0' },
    websocketResolver: resolver,
  }));
}

// Like mockPrepare, but the tenant verdict is resolved from the subscribing
// context's user organization — mirroring how prepareChannel resolves the
// verdict per subscriber.
function mockPrepareWithUserTenant({ resolver } = {}) {
  mockPrepareChannel.mockImplementation(async (context, { websocketId }) => ({
    connectionProperties: null,
    properties: { room: 1 },
    tenant: { field: 'organizationId', value: context.user.organizationId },
    websocketConfig: { websocketId, type: 'TestSource', '~k': 'websockets.0' },
    websocketResolver: resolver,
  }));
}

function createPendingResolver() {
  return jest.fn(() => new Promise(() => {}));
}

// Node's global performance object is not configurable, so it cannot be faked.
function useFakeTimers() {
  jest.useFakeTimers({ doNotFake: ['performance'] });
}

async function flushMicrotasks() {
  // Resolver start and failure handling run in promise microtasks.
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
}

async function advanceTimers(ms) {
  jest.advanceTimersByTime(ms);
  await flushMicrotasks();
}

afterEach(() => {
  jest.useRealTimers();
});

test('first subscribe starts the resolver with connection, properties, publish, signal and logger', async () => {
  const resolver = createPendingResolver();
  mockPrepare({ resolver, connectionProperties: { url: 'db://x' } });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, { websocketId: 'ticker', payload: { room: 1 }, subscriber });
  await flushMicrotasks();

  expect(resolver).toHaveBeenCalledTimes(1);
  const args = resolver.mock.calls[0][0];
  expect(args.connection).toEqual({ url: 'db://x' });
  expect(args.properties).toEqual({ room: 1 });
  expect(typeof args.publish).toBe('function');
  expect(args.signal).toBeInstanceOf(AbortSignal);
  expect(args.signal.aborted).toBe(false);
  expect(args.logger).toBe(context.logger);
  expect(registry.channels.size).toBe(1);
  expect(subscriber.subscriptions.has('ticker')).toBe(true);
});

test('second subscriber with identical evaluated properties shares the channel and resolver runs once', async () => {
  const resolver = createPendingResolver();
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriberA = createSubscriber('a');
  const subscriberB = createSubscriber('b');

  await registry.subscribe(context, { websocketId: 'ticker', payload: { room: 1 }, subscriber: subscriberA });
  await registry.subscribe(context, { websocketId: 'ticker', payload: { room: 1 }, subscriber: subscriberB });
  await flushMicrotasks();

  expect(resolver).toHaveBeenCalledTimes(1);
  expect(registry.channels.size).toBe(1);
  const channel = [...registry.channels.values()][0];
  expect(channel.subscribers.size).toBe(2);
});

test('subscribers with different evaluated properties get separate channels', async () => {
  const resolver = createPendingResolver();
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriberA = createSubscriber('a');
  const subscriberB = createSubscriber('b');

  await registry.subscribe(context, { websocketId: 'ticker', payload: { room: 1 }, subscriber: subscriberA });
  await registry.subscribe(context, { websocketId: 'ticker', payload: { room: 2 }, subscriber: subscriberB });
  await flushMicrotasks();

  expect(resolver).toHaveBeenCalledTimes(2);
  expect(registry.channels.size).toBe(2);
});

test('resolver publish broadcasts a message frame with serialized payload to all subscribers', async () => {
  const resolver = createPendingResolver();
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriberA = createSubscriber('a');
  const subscriberB = createSubscriber('b');

  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber: subscriberA });
  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber: subscriberB });
  await flushMicrotasks();

  const { publish } = resolver.mock.calls[0][0];
  publish({ data: { tick: 1, at: new Date(1000) } });

  const framesA = sentFrames(subscriberA);
  const framesB = sentFrames(subscriberB);
  expect(framesA).toEqual([
    {
      type: 'message',
      websocketId: 'ticker',
      payload: { data: { tick: 1, at: { '~d': 1000 } } },
    },
  ]);
  expect(framesB).toEqual(framesA);
});

test('unsubscribe of the last subscriber aborts the resolver signal and removes the channel', async () => {
  const resolver = createPendingResolver();
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber });
  await flushMicrotasks();
  const { signal } = resolver.mock.calls[0][0];

  registry.unsubscribe({ websocketId: 'ticker', subscriber });

  expect(signal.aborted).toBe(true);
  expect(registry.channels.size).toBe(0);
  expect(subscriber.subscriptions.has('ticker')).toBe(false);
});

test('unsubscribe keeps the channel running while other subscribers remain', async () => {
  const resolver = createPendingResolver();
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriberA = createSubscriber('a');
  const subscriberB = createSubscriber('b');

  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber: subscriberA });
  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber: subscriberB });
  await flushMicrotasks();
  const { signal } = resolver.mock.calls[0][0];

  registry.unsubscribe({ websocketId: 'ticker', subscriber: subscriberA });

  expect(signal.aborted).toBe(false);
  expect(registry.channels.size).toBe(1);
});

test('unsubscribeAll removes every subscription of a disconnecting subscriber', async () => {
  const resolver = createPendingResolver();
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber });
  await registry.subscribe(context, { websocketId: 'chat', payload: {}, subscriber });
  await flushMicrotasks();
  expect(registry.channels.size).toBe(2);

  registry.unsubscribeAll({ subscriber });

  expect(registry.channels.size).toBe(0);
  expect(subscriber.subscriptions.size).toBe(0);
});

test('re-subscribe to the same websocketId replaces the previous subscription', async () => {
  const resolver = createPendingResolver();
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, { websocketId: 'ticker', payload: { room: 1 }, subscriber });
  await flushMicrotasks();
  const firstSignal = resolver.mock.calls[0][0].signal;

  await registry.subscribe(context, { websocketId: 'ticker', payload: { room: 2 }, subscriber });
  await flushMicrotasks();

  expect(resolver).toHaveBeenCalledTimes(2);
  expect(firstSignal.aborted).toBe(true);
  expect(registry.channels.size).toBe(1);
  expect(subscriber.subscriptions.size).toBe(1);
  const channel = [...registry.channels.values()][0];
  expect(channel.properties).toEqual({ room: 2 });
});

test('resolver rejection sends an error frame to subscribers and restarts with backoff', async () => {
  useFakeTimers();
  const resolver = jest
    .fn()
    .mockRejectedValueOnce(new Error('source failed'))
    .mockImplementation(() => new Promise(() => {}));
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber });
  await flushMicrotasks();

  const frames = sentFrames(subscriber);
  expect(frames).toEqual([
    {
      type: 'error',
      websocketId: 'ticker',
      message: expect.stringContaining('source failed'),
    },
  ]);
  expect(context.handleError).toHaveBeenCalledTimes(1);
  expect(registry.channels.size).toBe(1);

  // First retry uses the base backoff delay.
  await advanceTimers(999);
  expect(resolver).toHaveBeenCalledTimes(1);
  await advanceTimers(1);
  expect(resolver).toHaveBeenCalledTimes(2);
  expect(registry.channels.size).toBe(1);
});

test('unsubscribe while a restart is pending cancels the retry and removes the channel', async () => {
  useFakeTimers();
  const resolver = jest.fn().mockRejectedValue(new Error('source failed'));
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber });
  await flushMicrotasks();
  expect(resolver).toHaveBeenCalledTimes(1);

  registry.unsubscribe({ websocketId: 'ticker', subscriber });
  await advanceTimers(10000);

  expect(resolver).toHaveBeenCalledTimes(1);
  expect(registry.channels.size).toBe(0);
});

test('pending restart is skipped when all subscribers have left the channel', async () => {
  useFakeTimers();
  const resolver = jest.fn().mockRejectedValue(new Error('source failed'));
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber });
  await flushMicrotasks();
  expect(resolver).toHaveBeenCalledTimes(1);

  // Empty the subscriber set directly so the restart timer itself hits the
  // no-subscribers guard.
  const channel = [...registry.channels.values()][0];
  channel.subscribers.clear();
  await advanceTimers(1000);

  expect(resolver).toHaveBeenCalledTimes(1);
  expect(registry.channels.size).toBe(0);
});

test('channel is removed after MAX_RETRIES consecutive resolver failures', async () => {
  useFakeTimers();
  const resolver = jest.fn().mockRejectedValue(new Error('source failed'));
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber });
  await flushMicrotasks();

  // Exponential backoff: 1s, 2s, 4s, 8s, 16s for the 5 retries.
  for (const delay of [1000, 2000, 4000, 8000, 16000]) {
    await advanceTimers(delay);
  }

  expect(resolver).toHaveBeenCalledTimes(6);
  expect(registry.channels.size).toBe(0);
  expect(context.logger.error).toHaveBeenCalledWith({
    event: 'ws_source_max_retries',
    websocketId: 'ticker',
  });
});

test('publish rejects with ConfigError when resolver meta.publish is not true', async () => {
  const resolver = createPendingResolver();
  resolver.meta = { publish: false };
  mockPrepare({ resolver, properties: { publish: true } });
  const registry = createChannelRegistry();
  const context = createTestContext();

  await expect(registry.publish(context, { websocketId: 'ticker', payload: {} })).rejects.toThrow(
    ConfigError
  );
  await expect(registry.publish(context, { websocketId: 'ticker', payload: {} })).rejects.toThrow(
    'Websocket "ticker" does not allow publishing.'
  );
});

test('publish rejects with ConfigError when websocket properties.publish is not true', async () => {
  const resolver = createPendingResolver();
  resolver.meta = { publish: true };
  mockPrepare({ resolver, properties: {} });
  const registry = createChannelRegistry();
  const context = createTestContext();

  await expect(registry.publish(context, { websocketId: 'ticker', payload: {} })).rejects.toThrow(
    'Websocket "ticker" does not allow publishing.'
  );
});

test('publish with no local channel resolves without error', async () => {
  const resolver = createPendingResolver();
  resolver.meta = { publish: true };
  mockPrepare({ resolver, properties: { publish: true } });
  const registry = createChannelRegistry();
  const context = createTestContext();

  await expect(
    registry.publish(context, { websocketId: 'ticker', payload: { a: 1 } })
  ).resolves.toBeUndefined();
});

test('publish deserializes the payload and broadcasts it through the channel', async () => {
  const resolver = createPendingResolver();
  resolver.meta = { publish: true };
  mockPrepare({ resolver, properties: { publish: true } });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, { websocketId: 'chat', payload: {}, subscriber });
  await flushMicrotasks();

  await registry.publish(context, {
    websocketId: 'chat',
    payload: { text: 'hi', at: { '~d': 5000 } },
  });

  // The serialized date survives the deserialize → publish → serialize round trip.
  expect(sentFrames(subscriber)).toEqual([
    {
      type: 'message',
      websocketId: 'chat',
      payload: { data: { text: 'hi', at: { '~d': 5000 } } },
    },
  ]);
});

test('resolver receives tenant null when prepareChannel resolves no tenant verdict', async () => {
  const resolver = createPendingResolver();
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber });
  await flushMicrotasks();

  expect(resolver.mock.calls[0][0].tenant).toBe(null);
});

test('resolver receives the tenant verdict resolved for the channel', async () => {
  const resolver = createPendingResolver();
  mockPrepare({ resolver, tenant: { field: 'organizationId', value: 'org-1' } });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber });
  await flushMicrotasks();

  expect(resolver.mock.calls[0][0].tenant).toEqual({ field: 'organizationId', value: 'org-1' });
});

test('subscribers with identical properties but different tenant verdicts get separate channels', async () => {
  const resolver = createPendingResolver();
  mockPrepareWithUserTenant({ resolver });
  const registry = createChannelRegistry();
  const contextOrgA = { ...createTestContext(), user: { sub: 'user-1', organizationId: 'org-a' } };
  const contextOrgB = { ...createTestContext(), user: { sub: 'user-2', organizationId: 'org-b' } };
  const subscriberA = createSubscriber('a');
  const subscriberB = createSubscriber('b');

  await registry.subscribe(contextOrgA, {
    websocketId: 'ticker',
    payload: { room: 1 },
    subscriber: subscriberA,
  });
  await registry.subscribe(contextOrgB, {
    websocketId: 'ticker',
    payload: { room: 1 },
    subscriber: subscriberB,
  });
  await flushMicrotasks();

  expect(resolver).toHaveBeenCalledTimes(2);
  expect(registry.channels.size).toBe(2);
  expect(resolver.mock.calls[0][0].tenant).toEqual({ field: 'organizationId', value: 'org-a' });
  expect(resolver.mock.calls[1][0].tenant).toEqual({ field: 'organizationId', value: 'org-b' });
});

test('subscribers with identical properties and the same tenant verdict share the channel', async () => {
  const resolver = createPendingResolver();
  mockPrepareWithUserTenant({ resolver });
  const registry = createChannelRegistry();
  const contextA = { ...createTestContext(), user: { sub: 'user-1', organizationId: 'org-a' } };
  const contextB = { ...createTestContext(), user: { sub: 'user-2', organizationId: 'org-a' } };
  const subscriberA = createSubscriber('a');
  const subscriberB = createSubscriber('b');

  await registry.subscribe(contextA, {
    websocketId: 'ticker',
    payload: { room: 1 },
    subscriber: subscriberA,
  });
  await registry.subscribe(contextB, {
    websocketId: 'ticker',
    payload: { room: 1 },
    subscriber: subscriberB,
  });
  await flushMicrotasks();

  expect(resolver).toHaveBeenCalledTimes(1);
  expect(registry.channels.size).toBe(1);
  const channel = [...registry.channels.values()][0];
  expect(channel.subscribers.size).toBe(2);
});

test('resolver errors after the channel is aborted are ignored', async () => {
  let rejectResolver;
  const resolver = jest.fn(
    () =>
      new Promise((resolve, reject) => {
        rejectResolver = reject;
      })
  );
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber });
  await flushMicrotasks();

  registry.unsubscribe({ websocketId: 'ticker', subscriber });
  rejectResolver(new Error('cursor closed'));
  await flushMicrotasks();

  expect(context.handleError).not.toHaveBeenCalled();
  expect(subscriber.send).not.toHaveBeenCalled();
});
