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

import { vi, afterEach, beforeAll, expect, test } from 'vitest';
import { ConfigError } from '@lowdefy/errors';

const mockPrepareChannel = vi.fn();
vi.doMock('./prepareChannel.js', () => ({
  default: mockPrepareChannel,
}));

let createChannelRegistry;

beforeAll(async () => {
  ({ default: createChannelRegistry } = await import('./createChannelRegistry.js'));
});

function createTestContext() {
  return {
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
    handleError: vi.fn(),
    user: { sub: 'user-1' },
  };
}

function createSubscriber(id, { i18n } = {}) {
  return { id, subscriptions: new Map(), send: vi.fn(), i18n };
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
    tenant: { field: 'organization_id', value: context.user.organization_id },
    websocketConfig: { websocketId, type: 'TestSource', '~k': 'websockets.0' },
    websocketResolver: resolver,
  }));
}

function createPendingResolver() {
  return vi.fn(() => new Promise(() => {}));
}

// Node's global performance object is not configurable, so it cannot be faked.
function useFakeTimers() {
  vi.useFakeTimers({
    toFake: [
      'Date',
      'hrtime',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  });
}

async function flushMicrotasks() {
  // Resolver start and failure handling run in promise microtasks.
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
}

async function advanceTimers(ms) {
  vi.advanceTimersByTime(ms);
  await flushMicrotasks();
}

afterEach(() => {
  vi.useRealTimers();
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

  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: { room: 1 },
    subscriber: subscriberA,
  });
  await registry.subscribe(context, {
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

test('subscribers with different evaluated properties get separate channels', async () => {
  const resolver = createPendingResolver();
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriberA = createSubscriber('a');
  const subscriberB = createSubscriber('b');

  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: { room: 1 },
    subscriber: subscriberA,
  });
  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: { room: 2 },
    subscriber: subscriberB,
  });
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

  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: {},
    subscriber: subscriberA,
  });
  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: {},
    subscriber: subscriberB,
  });
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

  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: {},
    subscriber: subscriberA,
  });
  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: {},
    subscriber: subscriberB,
  });
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

test('re-subscribe that fails to prepare leaves the previous subscription closed', async () => {
  const resolver = createPendingResolver();
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, { websocketId: 'ticker', payload: { room: 1 }, subscriber });
  await flushMicrotasks();
  const firstSignal = resolver.mock.calls[0][0].signal;

  mockPrepareChannel.mockImplementationOnce(async () => {
    throw new ConfigError('Websocket "ticker" does not exist.');
  });
  await expect(
    registry.subscribe(context, { websocketId: 'ticker', payload: { room: 2 }, subscriber })
  ).rejects.toThrow('Websocket "ticker" does not exist.');

  expect(firstSignal.aborted).toBe(true);
  expect(registry.channels.size).toBe(0);
  expect(subscriber.subscriptions.size).toBe(0);
});

test('resolver rejection sends an error frame to subscribers and restarts with backoff', async () => {
  useFakeTimers();
  const resolver = vi
    .fn()
    .mockRejectedValueOnce(new Error('source failed: mongodb://admin:planted-secret-value@db'))
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
      message: 'Something went wrong.',
    },
  ]);
  expect(context.handleError).toHaveBeenCalledTimes(1);
  // The server keeps the full error; only the frame is reduced.
  expect(context.handleError.mock.calls[0][0].message).toContain('planted-secret-value');
  expect(registry.channels.size).toBe(1);

  // First retry uses the base backoff delay.
  await advanceTimers(999);
  expect(resolver).toHaveBeenCalledTimes(1);
  await advanceTimers(1);
  expect(resolver).toHaveBeenCalledTimes(2);
  expect(registry.channels.size).toBe(1);
});

test('resolver rejection is reported as a RequestError without the evaluated properties', async () => {
  const sourceError = new Error('source failed');
  sourceError.document = { email: 'planted@example.com' };
  const resolver = vi
    .fn()
    .mockRejectedValueOnce(sourceError)
    .mockImplementation(() => new Promise(() => {}));
  mockPrepare({ resolver, properties: { filter: { email: 'planted@example.com' } } });
  const registry = createChannelRegistry();
  const context = createTestContext();

  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: {},
    subscriber: createSubscriber('a'),
  });
  await flushMicrotasks();

  const reported = context.handleError.mock.calls[0][0];
  expect(reported.name).toBe('RequestError');
  expect(reported.typeName).toBe('TestSource');
  expect(reported.configKey).toBe('websockets.0');
  expect(reported.received).toBeUndefined();
  expect(reported.cause).not.toBe(sourceError);
  expect(reported.cause.message).toBe('source failed');
  expect(reported.cause.document).toBeUndefined();
  expect(reported.devCause).toBe(sourceError);
  expect(Object.keys(reported)).not.toContain('devCause');
});

test('resolver rejection translates the error message with each subscriber locale', async () => {
  const resolver = vi.fn().mockRejectedValueOnce(new Error('source failed'));
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const english = createSubscriber('a', { i18n: { active: 'en-US', messages: {} } });
  const french = createSubscriber('b', {
    i18n: {
      active: 'fr',
      messages: { fr: { 'server.genericError': 'Une erreur est survenue.' } },
    },
  });

  // Both join before the rejection is handled, so one failure reaches both.
  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber: english });
  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber: french });
  await flushMicrotasks();

  expect(sentFrames(english)).toEqual([
    { type: 'error', websocketId: 'ticker', message: 'Something went wrong.' },
  ]);
  expect(sentFrames(french)).toEqual([
    { type: 'error', websocketId: 'ticker', message: 'Une erreur est survenue.' },
  ]);
});

test('unsubscribe while a restart is pending cancels the retry and removes the channel', async () => {
  useFakeTimers();
  const resolver = vi.fn().mockRejectedValue(new Error('source failed'));
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
  const resolver = vi.fn().mockRejectedValue(new Error('source failed'));
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

function readyResolver() {
  return ({ ready }) => {
    ready();
    return new Promise(() => {});
  };
}

test('a source that fails 8 times keeps its channel, is reported once and tells subscribers when it is back', async () => {
  useFakeTimers();
  const resolver = vi.fn();
  for (let i = 0; i < 8; i += 1) {
    resolver.mockRejectedValueOnce(new Error('source failed'));
  }
  resolver.mockImplementation(readyResolver());
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const first = createSubscriber('a');
  const second = createSubscriber('b');

  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: {},
    requestId: 's1',
    subscriber: first,
  });
  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: {},
    requestId: 's4',
    subscriber: second,
  });
  await flushMicrotasks();

  // Backoff doubles from 1 s and stops growing at 60 s.
  for (const delay of [1000, 2000, 4000, 8000, 16000, 32000]) {
    await advanceTimers(delay);
  }
  expect(resolver).toHaveBeenCalledTimes(7);
  await advanceTimers(59999);
  expect(resolver).toHaveBeenCalledTimes(7);
  await advanceTimers(1);
  expect(resolver).toHaveBeenCalledTimes(8);
  await advanceTimers(60000);
  expect(resolver).toHaveBeenCalledTimes(9);

  expect(registry.channels.size).toBe(1);
  // The outage's first failure is reported; the restarts that fail after it are warnings.
  expect(context.handleError).toHaveBeenCalledTimes(1);
  expect(context.logger.warn).toHaveBeenCalledTimes(7);
  expect(context.logger.warn).toHaveBeenLastCalledWith(
    {
      event: 'ws_source_restart_failed',
      websocketId: 'ticker',
      retryCount: 7,
      retryInMs: 60000,
    },
    expect.any(String)
  );
  const error = { type: 'error', websocketId: 'ticker', message: 'Something went wrong.' };
  expect(sentFrames(first)).toEqual([
    ...Array(8).fill(error),
    { type: 'subscribed', websocketId: 'ticker', requestId: 's1' },
  ]);
  expect(sentFrames(second)).toEqual([
    ...Array(8).fill(error),
    { type: 'subscribed', websocketId: 'ticker', requestId: 's4' },
  ]);
});

test('a source that is ready on its first start sends no subscribed frame', async () => {
  const resolver = vi.fn(readyResolver());
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const subscriber = createSubscriber('a');

  await registry.subscribe(createTestContext(), {
    websocketId: 'ticker',
    payload: {},
    requestId: 's1',
    subscriber,
  });
  await flushMicrotasks();

  expect(sentFrames(subscriber)).toEqual([]);
});

test('a restarted source that publishes is back before its message is sent', async () => {
  useFakeTimers();
  const resolver = vi
    .fn()
    .mockRejectedValueOnce(new Error('source failed'))
    .mockImplementation(({ publish }) => {
      publish({ data: { tick: 1 } });
      return new Promise(() => {});
    });
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const subscriber = createSubscriber('a');

  await registry.subscribe(createTestContext(), {
    websocketId: 'ticker',
    payload: {},
    requestId: 's1',
    subscriber,
  });
  await flushMicrotasks();
  await advanceTimers(1000);

  expect(sentFrames(subscriber).map((frame) => frame.type)).toEqual([
    'error',
    'subscribed',
    'message',
  ]);
});

test('a source that fails again after it was back is reported again', async () => {
  useFakeTimers();
  const resolver = vi
    .fn()
    .mockRejectedValueOnce(new Error('source failed'))
    .mockImplementationOnce(async ({ ready }) => {
      ready();
      throw new Error('source failed again');
    })
    .mockImplementation(() => new Promise(() => {}));
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: {},
    requestId: 's1',
    subscriber,
  });
  await flushMicrotasks();
  await advanceTimers(1000);

  expect(context.handleError).toHaveBeenCalledTimes(2);
  expect(context.logger.warn).not.toHaveBeenCalled();
  expect(sentFrames(subscriber).map((frame) => frame.type)).toEqual([
    'error',
    'subscribed',
    'error',
  ]);
});

test('a subscriber that left during an outage is not told the source is back', async () => {
  useFakeTimers();
  const resolver = vi
    .fn()
    .mockRejectedValueOnce(new Error('source failed'))
    .mockImplementation(readyResolver());
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const staying = createSubscriber('a');
  const leaving = createSubscriber('b');

  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: {},
    requestId: 's1',
    subscriber: staying,
  });
  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: {},
    requestId: 's2',
    subscriber: leaving,
  });
  await flushMicrotasks();
  registry.unsubscribe({ websocketId: 'ticker', subscriber: leaving });
  await advanceTimers(1000);

  expect(sentFrames(staying).map((frame) => frame.type)).toEqual(['error', 'subscribed']);
  expect(sentFrames(leaving).map((frame) => frame.type)).toEqual(['error']);
});

function failAfter(ms, { ready: callReady = false } = {}) {
  return ({ ready }) =>
    new Promise((resolve, reject) => {
      if (callReady) ready();
      setTimeout(() => reject(new Error('source failed')), ms);
    });
}

test('a run that takes over a minute to fail without being ready does not reset the backoff', async () => {
  useFakeTimers();
  const resolver = vi
    .fn()
    .mockImplementationOnce(failAfter(61000))
    .mockImplementationOnce(failAfter(61000))
    .mockImplementation(() => new Promise(() => {}));
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();

  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: {},
    requestId: 's1',
    subscriber: createSubscriber('a'),
  });
  await flushMicrotasks();
  await advanceTimers(61000);
  await advanceTimers(1000);
  await advanceTimers(61000);

  expect(context.logger.warn).toHaveBeenCalledWith(
    expect.objectContaining({ retryCount: 1, retryInMs: 2000 }),
    expect.any(String)
  );
});

test('a run that stayed ready for over a minute resets the backoff', async () => {
  useFakeTimers();
  const resolver = vi
    .fn()
    .mockRejectedValueOnce(new Error('source failed'))
    .mockImplementationOnce(failAfter(61000, { ready: true }))
    .mockImplementation(() => new Promise(() => {}));
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const context = createTestContext();

  await registry.subscribe(context, {
    websocketId: 'ticker',
    payload: {},
    requestId: 's1',
    subscriber: createSubscriber('a'),
  });
  await flushMicrotasks();
  await advanceTimers(1000);
  await advanceTimers(61000);
  expect(resolver).toHaveBeenCalledTimes(2);
  await advanceTimers(999);
  expect(resolver).toHaveBeenCalledTimes(2);
  await advanceTimers(1);
  expect(resolver).toHaveBeenCalledTimes(3);
});

test('a failed run that calls ready after it failed does not end the outage', async () => {
  useFakeTimers();
  let lateReady;
  const resolver = vi
    .fn()
    .mockImplementationOnce(({ ready }) => {
      lateReady = ready;
      return Promise.reject(new Error('source failed'));
    })
    .mockImplementation(() => new Promise(() => {}));
  mockPrepare({ resolver });
  const registry = createChannelRegistry();
  const subscriber = createSubscriber('a');

  await registry.subscribe(createTestContext(), {
    websocketId: 'ticker',
    payload: {},
    requestId: 's1',
    subscriber,
  });
  await flushMicrotasks();
  lateReady();

  expect(sentFrames(subscriber).map((frame) => frame.type)).toEqual(['error']);
  expect([...registry.channels.values()][0].failing).toBe(true);
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
  mockPrepare({ resolver, tenant: { field: 'organization_id', value: 'org-1' } });
  const registry = createChannelRegistry();
  const context = createTestContext();
  const subscriber = createSubscriber('a');

  await registry.subscribe(context, { websocketId: 'ticker', payload: {}, subscriber });
  await flushMicrotasks();

  expect(resolver.mock.calls[0][0].tenant).toEqual({ field: 'organization_id', value: 'org-1' });
});

test('subscribers with identical properties but different tenant verdicts get separate channels', async () => {
  const resolver = createPendingResolver();
  mockPrepareWithUserTenant({ resolver });
  const registry = createChannelRegistry();
  const contextOrgA = { ...createTestContext(), user: { sub: 'user-1', organization_id: 'org-a' } };
  const contextOrgB = { ...createTestContext(), user: { sub: 'user-2', organization_id: 'org-b' } };
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
  expect(resolver.mock.calls[0][0].tenant).toEqual({ field: 'organization_id', value: 'org-a' });
  expect(resolver.mock.calls[1][0].tenant).toEqual({ field: 'organization_id', value: 'org-b' });
});

test('subscribers with identical properties and the same tenant verdict share the channel', async () => {
  const resolver = createPendingResolver();
  mockPrepareWithUserTenant({ resolver });
  const registry = createChannelRegistry();
  const contextA = { ...createTestContext(), user: { sub: 'user-1', organization_id: 'org-a' } };
  const contextB = { ...createTestContext(), user: { sub: 'user-2', organization_id: 'org-a' } };
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
  const resolver = vi.fn(
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

test('subscribe hands prepareChannel the deserialized payload', async () => {
  const registry = createChannelRegistry();
  mockPrepare({ resolver: createPendingResolver() });
  const subscriber = createSubscriber('a');

  await registry.subscribe(createTestContext(), {
    websocketId: 'ws1',
    payload: { since: { '~d': 0 } },
    subscriber,
  });

  const [, options] = mockPrepareChannel.mock.calls.at(-1);
  expect(options.payload.since).toEqual(new Date(0));
});
