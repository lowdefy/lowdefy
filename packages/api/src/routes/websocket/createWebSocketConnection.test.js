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

import { vi, afterEach, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { AuthorizationError } from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';

const mockPrepareChannel = vi.fn();
vi.doMock('./prepareChannel.js', () => ({
  default: mockPrepareChannel,
}));

// Stands in for the session read: each call resolves the caller the test has
// set as current, the way resolveAuthentication writes it to the object passed.
let mockCurrentCaller = null;
const mockResolveAuthentication = vi.fn(async (target) => {
  target.user = mockCurrentCaller;
});
vi.doMock('../../context/resolveAuthentication.js', () => ({
  default: mockResolveAuthentication,
}));

let createChannelRegistry;
let createWebSocketConnection;

beforeAll(async () => {
  ({ default: createChannelRegistry } = await import('./createChannelRegistry.js'));
  ({ default: createWebSocketConnection } = await import('./createWebSocketConnection.js'));
});

function setup({ mode = 'prod' } = {}) {
  const registry = {
    subscribe: vi.fn(async () => {}),
    unsubscribe: vi.fn(),
    unsubscribeAll: vi.fn(),
    publish: vi.fn(async () => {}),
  };
  const send = vi.fn();
  const context = {
    rid: 'r',
    mode,
    i18n: { active: 'en-US', messages: {} },
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
    handleError: vi.fn(),
  };
  const connection = createWebSocketConnection(context, { registry, send });
  return { connection, context, registry, send };
}

function sentFrames(send) {
  return send.mock.calls.map(([message]) => JSON.parse(message));
}

test('invalid JSON frame sends an error frame', async () => {
  const { connection, send } = setup();

  await connection.handleMessage('not json {');

  expect(sentFrames(send)).toEqual([{ type: 'error', message: 'Invalid frame — expected JSON.' }]);
});

test('non-object frame sends an error frame', async () => {
  const { connection, send } = setup();

  await connection.handleMessage('[1, 2]');
  await connection.handleMessage('"subscribe"');

  expect(sentFrames(send)).toEqual([
    { type: 'error', message: 'Invalid frame — expected an object.' },
    { type: 'error', message: 'Invalid frame — expected an object.' },
  ]);
});

test('frame with missing websocketId sends an error frame', async () => {
  const { connection, send } = setup();

  await connection.handleMessage(JSON.stringify({ type: 'subscribe' }));

  expect(sentFrames(send)).toEqual([
    { type: 'error', message: 'Frame "websocketId" should be a string.' },
  ]);
});

test('frame with non-string websocketId sends an error frame carrying the requestId', async () => {
  const { connection, registry, send } = setup();

  await connection.handleMessage(
    JSON.stringify({ type: 'publish', websocketId: 7, requestId: 'req-1' })
  );

  expect(sentFrames(send)).toEqual([
    { type: 'error', requestId: 'req-1', message: 'Frame "websocketId" should be a string.' },
  ]);
  expect(registry.publish).not.toHaveBeenCalled();
});

test.each([
  ['without a requestId', {}, { type: 'subscribed', websocketId: 'ticker' }],
  [
    'with a requestId',
    { requestId: 's1' },
    { type: 'subscribed', websocketId: 'ticker', requestId: 's1' },
  ],
])(
  'subscribe frame %s calls registry.subscribe and acks with a subscribed frame echoing it',
  async (_, extra, ack) => {
    const { connection, context, registry, send } = setup();

    await connection.handleMessage(
      JSON.stringify({ type: 'subscribe', websocketId: 'ticker', payload: { room: 1 }, ...extra })
    );

    expect(registry.subscribe).toHaveBeenCalledWith(context, {
      websocketId: 'ticker',
      payload: { room: 1 },
      subscriber: connection.subscriber,
    });
    expect(sentFrames(send)).toEqual([ack]);
  }
);

test('unsubscribe frame calls registry.unsubscribe and acks with an unsubscribed frame', async () => {
  const { connection, registry, send } = setup();

  await connection.handleMessage(JSON.stringify({ type: 'unsubscribe', websocketId: 'ticker' }));

  expect(registry.unsubscribe).toHaveBeenCalledWith({
    websocketId: 'ticker',
    subscriber: connection.subscriber,
  });
  expect(sentFrames(send)).toEqual([{ type: 'unsubscribed', websocketId: 'ticker' }]);
});

test('publish frame calls registry.publish and acks with a published frame carrying the requestId', async () => {
  const { connection, context, registry, send } = setup();

  await connection.handleMessage(
    JSON.stringify({
      type: 'publish',
      websocketId: 'chat',
      payload: { text: 'hi' },
      requestId: 'req-9',
    })
  );

  expect(registry.publish).toHaveBeenCalledWith(context, {
    websocketId: 'chat',
    payload: { text: 'hi' },
  });
  expect(sentFrames(send)).toEqual([
    { type: 'published', websocketId: 'chat', requestId: 'req-9' },
  ]);
});

test('registry rejection sends an error payload frame with requestId and websocketId and reports the error', async () => {
  const { connection, context, registry, send } = setup();
  const error = new Error('Websocket "chat" does not allow publishing.');
  registry.publish.mockRejectedValue(error);

  await connection.handleMessage(
    JSON.stringify({ type: 'publish', websocketId: 'chat', requestId: 'req-2' })
  );

  expect(context.handleError).toHaveBeenCalledWith(error);
  expect(sentFrames(send)).toEqual([
    {
      type: 'error',
      websocketId: 'chat',
      requestId: 'req-2',
      error: {
        '~e': {
          name: 'Error',
          message: 'Something went wrong.',
          requestId: 'r',
          isLowdefyError: true,
        },
      },
    },
  ]);
});

test('an authorization refusal warns and answers the client without reporting an error', async () => {
  const { connection, context, registry, send } = setup();
  const error = new AuthorizationError('Websocket "chat" does not exist.');
  registry.subscribe.mockRejectedValue(error);

  await connection.handleMessage(
    JSON.stringify({ type: 'subscribe', websocketId: 'chat', requestId: 'req-3' })
  );

  expect(context.handleError).not.toHaveBeenCalled();
  expect(context.logger.warn).toHaveBeenCalledWith(
    { event: 'ws_refused', frameType: 'subscribe' },
    'Websocket "chat" does not exist.'
  );
  const [frame] = sentFrames(send);
  expect(frame.type).toBe('error');
  expect(frame.websocketId).toBe('chat');
  expect(frame.requestId).toBe('req-3');
  expect(frame.error['~e']).toEqual({
    name: 'AuthorizationError',
    message: 'Websocket "chat" does not exist.',
    requestId: 'r',
    isLowdefyError: true,
  });
});

function setupPublishFailure({ mode }) {
  const resolver = vi.fn(() => new Promise(() => {}));
  resolver.meta = { publish: true };
  resolver.onPublish = vi.fn(async () => {
    throw new Error('insert failed: postgres://admin:planted-secret-value@db.internal:5432');
  });
  mockPrepareChannel.mockImplementation(async (context, { websocketId }) => ({
    connectionProperties: null,
    properties: { publish: true },
    websocketConfig: { websocketId, type: 'TestSource', '~k': 'websockets.0' },
    websocketResolver: resolver,
  }));
  const send = vi.fn();
  const context = {
    rid: 'r',
    mode,
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn() },
    handleError: vi.fn(),
  };
  const connection = createWebSocketConnection(context, {
    registry: createChannelRegistry(),
    send,
  });
  return { connection, send };
}

async function publishThroughFailingOnPublish({ mode }) {
  const { connection, send } = setupPublishFailure({ mode });
  await connection.handleMessage(JSON.stringify({ type: 'subscribe', websocketId: 'chat' }));
  await connection.handleMessage(
    JSON.stringify({ type: 'publish', websocketId: 'chat', payload: {}, requestId: 'req-3' })
  );
  return sentFrames(send).find((frame) => frame.type === 'error');
}

test('onPublish failure sends the generic error payload in prod with no devError', async () => {
  const frame = await publishThroughFailingOnPublish({ mode: 'prod' });

  expect(frame.websocketId).toBe('chat');
  expect(frame.requestId).toBe('req-3');
  expect('message' in frame).toBe(false);
  expect('devError' in frame.error).toBe(false);
  expect(JSON.stringify(frame)).not.toContain('planted-secret-value');
  const error = serializer.deserialize(frame.error);
  expect(error.name).toBe('Error');
  expect(error.message).toBe('Something went wrong.');
  expect(error.requestId).toBe('r');
});

test('onPublish failure sends the same wire error in dev with the raw message in devError', async () => {
  const frame = await publishThroughFailingOnPublish({ mode: 'dev' });

  expect(serializer.deserialize(frame.error).message).toBe('Something went wrong.');
  expect(frame.error['~e'].message).toBe('Something went wrong.');
  expect(frame.error.devError['~e'].message).toBe(
    'insert failed: postgres://admin:planted-secret-value@db.internal:5432'
  );
});

test('unknown frame type is ignored without sending a response', async () => {
  const { connection, context, registry, send } = setup();

  await connection.handleMessage(JSON.stringify({ type: 'ping', websocketId: 'ticker' }));

  expect(send).not.toHaveBeenCalled();
  expect(registry.subscribe).not.toHaveBeenCalled();
  expect(registry.unsubscribe).not.toHaveBeenCalled();
  expect(registry.publish).not.toHaveBeenCalled();
  expect(context.logger.debug).toHaveBeenCalledWith({
    event: 'ws_unknown_frame',
    frameType: 'ping',
  });
});

test('close unsubscribes the subscriber from all channels', () => {
  const { connection, registry } = setup();

  connection.close();

  expect(registry.unsubscribeAll).toHaveBeenCalledWith({ subscriber: connection.subscriber });
});

test('close reports a failure of the unsubscribe that runs after frames in progress finish', async () => {
  const { connection, context, registry } = setup();
  const error = new Error('Channel cleanup failed.');
  registry.unsubscribeAll
    .mockImplementationOnce(() => {})
    .mockImplementationOnce(() => {
      throw error;
    });

  connection.close();
  await Promise.resolve();
  await Promise.resolve();

  expect(context.handleError).toHaveBeenCalledWith(error);
});

test('subscriber is created with the connection rid, the context i18n and an empty subscriptions map', () => {
  const { connection, context } = setup();

  expect(connection.subscriber.id).toBe('r');
  expect(connection.subscriber.subscriptions).toBeInstanceOf(Map);
  expect(connection.subscriber.subscriptions.size).toBe(0);
  expect(typeof connection.subscriber.send).toBe('function');
  expect(connection.subscriber.i18n).toBe(context.i18n);
});

// Lets queued frames run until the held subscribe reaches its channel
// preparation.
async function untilPreparing(releases) {
  for (let tick = 0; tick < 20 && releases.length === 0; tick += 1) {
    await Promise.resolve();
  }
}

function setupHeldSubscribe() {
  const releases = [];
  const resolver = vi.fn(() => new Promise(() => {}));
  mockPrepareChannel.mockImplementation(
    (context, { websocketId }) =>
      new Promise((resolve) => {
        releases.push(() =>
          resolve({
            connectionProperties: null,
            properties: {},
            websocketConfig: { websocketId, type: 'TestSource', '~k': 'websockets.0' },
            websocketResolver: resolver,
          })
        );
      })
  );
  const send = vi.fn();
  const context = {
    rid: 'r',
    mode: 'prod',
    logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn() },
    handleError: vi.fn(),
  };
  const registry = createChannelRegistry();
  const connection = createWebSocketConnection(context, { registry, send });
  return { connection, registry, releases, resolver, send };
}

test('an unsubscribe sent while its subscribe is being prepared removes the subscription', async () => {
  const { connection, releases, send } = setupHeldSubscribe();

  const subscribed = connection.handleMessage(
    JSON.stringify({ type: 'subscribe', websocketId: 'chat', requestId: 's1' })
  );
  const unsubscribed = connection.handleMessage(
    JSON.stringify({ type: 'unsubscribe', websocketId: 'chat' })
  );
  await untilPreparing(releases);
  releases[0]();
  await Promise.all([subscribed, unsubscribed]);

  expect(connection.subscriber.subscriptions.size).toBe(0);
  expect(sentFrames(send)).toEqual([
    { type: 'subscribed', websocketId: 'chat', requestId: 's1' },
    { type: 'unsubscribed', websocketId: 'chat' },
  ]);
});

test('a connection that closes while a subscribe is being prepared leaves no subscription behind', async () => {
  const { connection, registry, releases } = setupHeldSubscribe();
  const unsubscribeAll = vi.spyOn(registry, 'unsubscribeAll');

  const subscribed = connection.handleMessage(
    JSON.stringify({ type: 'subscribe', websocketId: 'chat', requestId: 's1' })
  );
  const queuedBeforeClose = connection.handleMessage(
    JSON.stringify({ type: 'subscribe', websocketId: 'chat', requestId: 's2' })
  );
  await untilPreparing(releases);
  connection.close();
  const sentAfterClose = connection.handleMessage(
    JSON.stringify({ type: 'subscribe', websocketId: 'news', requestId: 's3' })
  );
  releases[0]();
  await Promise.all([subscribed, queuedBeforeClose, sentAfterClose]);
  await Promise.resolve();

  expect(releases).toHaveLength(1);
  expect(unsubscribeAll).toHaveBeenCalledTimes(2);
  expect(connection.subscriber.subscriptions.size).toBe(0);
});

test('a slow publish on one feed does not hold up a subscribe to another feed', async () => {
  const { connection, registry, send } = setup();
  registry.publish.mockImplementation(() => new Promise(() => {}));

  connection.handleMessage(
    JSON.stringify({ type: 'publish', websocketId: 'chat', payload: {}, requestId: 'p1' })
  );
  await connection.handleMessage(
    JSON.stringify({ type: 'subscribe', websocketId: 'ticker', requestId: 's1' })
  );

  expect(sentFrames(send)).toEqual([
    { type: 'subscribed', websocketId: 'ticker', requestId: 's1' },
  ]);
});

describe('caller re-check', () => {
  const member = {
    id: 'user-1',
    name: 'Ada',
    organization_id: 'org-1',
    roles: ['editor', 'admin'],
  };

  beforeEach(() => {
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
    mockResolveAuthentication.mockClear();
    mockCurrentCaller = member;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function flush() {
    for (let tick = 0; tick < 10; tick += 1) {
      await Promise.resolve();
    }
  }

  function setupWithAuth({ user = member } = {}) {
    const registry = {
      subscribe: vi.fn(async () => {}),
      unsubscribe: vi.fn(),
      unsubscribeAll: vi.fn(),
      publish: vi.fn(async () => {}),
    };
    const send = vi.fn();
    const closeSocket = vi.fn();
    const headers = new Headers({ cookie: 'session=1' });
    const strategies = [];
    const context = {
      rid: 'r',
      mode: 'prod',
      auth: { api: {} },
      config: {},
      user,
      i18n: { active: 'en-US', messages: {} },
      logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() },
      handleError: vi.fn(),
    };
    const connection = createWebSocketConnection(context, {
      closeSocket,
      headers,
      registry,
      send,
      strategies,
    });
    return { closeSocket, connection, context, headers, registry, send, strategies };
  }

  test('a subscribe resolves the caller from the upgrade headers before the channel is prepared', async () => {
    const { connection, context, headers, registry, strategies } = setupWithAuth();

    await connection.handleMessage(
      JSON.stringify({ type: 'subscribe', websocketId: 'ticker', requestId: 's1' })
    );

    expect(mockResolveAuthentication).toHaveBeenCalledTimes(1);
    expect(mockResolveAuthentication).toHaveBeenCalledWith(
      { config: context.config, logger: context.logger, user: member },
      { auth: context.auth, headers, strategies }
    );
    expect(mockResolveAuthentication.mock.invocationCallOrder[0]).toBeLessThan(
      registry.subscribe.mock.invocationCallOrder[0]
    );
  });

  test('a re-check leaves the caller on the connection context as it was at upgrade', async () => {
    const { connection, context } = setupWithAuth();
    mockCurrentCaller = { ...member, name: 'Ada L.' };

    await connection.handleMessage(
      JSON.stringify({ type: 'subscribe', websocketId: 'ticker', requestId: 's1' })
    );

    expect(context.user).toBe(member);
  });

  test('a subscribe from a caller that signed out closes the socket with 4401 and is not subscribed', async () => {
    const { closeSocket, connection, registry, send } = setupWithAuth();
    mockCurrentCaller = null;

    await connection.handleMessage(
      JSON.stringify({ type: 'subscribe', websocketId: 'ticker', requestId: 's1' })
    );

    expect(closeSocket).toHaveBeenCalledWith({ code: 4401, reason: 'caller-changed' });
    expect(registry.subscribe).not.toHaveBeenCalled();
    expect(registry.unsubscribeAll).toHaveBeenCalledWith({ subscriber: connection.subscriber });
    expect(send).not.toHaveBeenCalled();
  });

  test.each([
    ['the caller signs out', null],
    ['the session is revoked', null],
    ['the membership is removed', null],
    ['a role is removed', { ...member, roles: ['editor'] }],
    ['a role is added', { ...member, roles: ['editor', 'admin', 'owner'] }],
    ['the caller switches organization', { ...member, organization_id: 'org-2' }],
    ['another user signs in on the same browser', { ...member, id: 'user-2' }],
  ])('the socket closes with 4401 within 60 seconds when %s', async (_, caller) => {
    const { closeSocket, connection, registry } = setupWithAuth();
    mockCurrentCaller = caller;

    vi.advanceTimersByTime(59 * 1000);
    await flush();
    expect(closeSocket).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    await flush();
    expect(closeSocket).toHaveBeenCalledTimes(1);
    expect(closeSocket).toHaveBeenCalledWith({ code: 4401, reason: 'caller-changed' });
    expect(registry.unsubscribeAll).toHaveBeenCalledWith({ subscriber: connection.subscriber });
  });

  test('an anonymous socket closes with 4401 when a session appears', async () => {
    const { closeSocket } = setupWithAuth({ user: null });
    mockCurrentCaller = member;

    vi.advanceTimersByTime(60 * 1000);
    await flush();

    expect(closeSocket).toHaveBeenCalledWith({ code: 4401, reason: 'caller-changed' });
  });

  test.each([
    ['the caller is unchanged', member],
    ['the roles come back in another order', { ...member, roles: ['admin', 'editor'] }],
    ['only the name changed', { ...member, name: 'Ada L.' }],
  ])('the socket stays open when %s', async (_, caller) => {
    const { closeSocket, connection, registry, send } = setupWithAuth();
    mockCurrentCaller = caller;

    vi.advanceTimersByTime(3 * 60 * 1000);
    await flush();
    await connection.handleMessage(
      JSON.stringify({ type: 'subscribe', websocketId: 'ticker', requestId: 's1' })
    );

    expect(mockResolveAuthentication).toHaveBeenCalledTimes(4);
    expect(closeSocket).not.toHaveBeenCalled();
    expect(registry.subscribe).toHaveBeenCalledTimes(1);
    expect(sentFrames(send)).toEqual([
      { type: 'subscribed', websocketId: 'ticker', requestId: 's1' },
    ]);
  });

  test('an anonymous socket stays open while no session appears', async () => {
    const { closeSocket } = setupWithAuth({ user: null });
    mockCurrentCaller = null;

    vi.advanceTimersByTime(60 * 1000);
    await flush();

    expect(mockResolveAuthentication).toHaveBeenCalledTimes(1);
    expect(closeSocket).not.toHaveBeenCalled();
  });

  test('a connection runs one re-check timer however many feeds it subscribes', async () => {
    const { connection } = setupWithAuth();

    await connection.handleMessage(JSON.stringify({ type: 'subscribe', websocketId: 'a' }));
    await connection.handleMessage(JSON.stringify({ type: 'subscribe', websocketId: 'b' }));
    await connection.handleMessage(JSON.stringify({ type: 'subscribe', websocketId: 'c' }));

    expect(vi.getTimerCount()).toBe(1);
  });

  test('close clears the re-check timer', async () => {
    const { closeSocket, connection } = setupWithAuth();
    mockCurrentCaller = null;

    connection.close();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(60 * 1000);
    await flush();

    expect(mockResolveAuthentication).not.toHaveBeenCalled();
    expect(closeSocket).not.toHaveBeenCalled();
  });

  test('a re-check that fails reports the error and closes the socket with 1011', async () => {
    const { closeSocket, context } = setupWithAuth();
    const error = new Error('Session store unreachable.');
    mockResolveAuthentication.mockRejectedValueOnce(error);

    vi.advanceTimersByTime(60 * 1000);
    await flush();

    expect(context.handleError).toHaveBeenCalledWith(error);
    expect(closeSocket).toHaveBeenCalledWith({ code: 1011, reason: 'caller-check-failed' });
  });

  test('a re-check that finishes after the socket closed does not close it again', async () => {
    const { closeSocket, connection } = setupWithAuth();
    let finish;
    mockResolveAuthentication.mockImplementationOnce(
      (target) =>
        new Promise((resolve) => {
          finish = () => {
            target.user = null;
            resolve();
          };
        })
    );

    vi.advanceTimersByTime(60 * 1000);
    await flush();
    connection.close();
    finish();
    await flush();

    expect(closeSocket).not.toHaveBeenCalled();
  });

  test('a context without an auth engine keeps the caller it was built with', async () => {
    const { closeSocket, connection, context } = setupWithAuth();
    context.auth = null;

    vi.advanceTimersByTime(60 * 1000);
    await flush();
    await connection.handleMessage(
      JSON.stringify({ type: 'subscribe', websocketId: 'ticker', requestId: 's1' })
    );

    expect(mockResolveAuthentication).not.toHaveBeenCalled();
    expect(closeSocket).not.toHaveBeenCalled();
  });
});
