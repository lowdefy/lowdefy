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
import { AuthorizationError } from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';

const mockPrepareChannel = jest.fn();
jest.unstable_mockModule('./prepareChannel.js', () => ({
  default: mockPrepareChannel,
}));

let createChannelRegistry;
let createWebSocketConnection;

beforeAll(async () => {
  ({ default: createChannelRegistry } = await import('./createChannelRegistry.js'));
  ({ default: createWebSocketConnection } = await import('./createWebSocketConnection.js'));
});

function setup({ mode = 'prod' } = {}) {
  const registry = {
    subscribe: jest.fn(async () => {}),
    unsubscribe: jest.fn(),
    unsubscribeAll: jest.fn(),
    publish: jest.fn(async () => {}),
  };
  const send = jest.fn();
  const context = {
    rid: 'r',
    mode,
    i18n: { active: 'en-US', messages: {} },
    logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
    handleError: jest.fn(),
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
  const resolver = jest.fn(() => new Promise(() => {}));
  resolver.meta = { publish: true };
  resolver.onPublish = jest.fn(async () => {
    throw new Error('insert failed: postgres://admin:planted-secret-value@db.internal:5432');
  });
  mockPrepareChannel.mockImplementation(async (context, { websocketId }) => ({
    connectionProperties: null,
    properties: { publish: true },
    websocketConfig: { websocketId, type: 'TestSource', '~k': 'websockets.0' },
    websocketResolver: resolver,
  }));
  const send = jest.fn();
  const context = {
    rid: 'r',
    mode,
    logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn() },
    handleError: jest.fn(),
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

test('subscriber is created with the connection rid, the context i18n and an empty subscriptions map', () => {
  const { connection, context } = setup();

  expect(connection.subscriber.id).toBe('r');
  expect(connection.subscriber.subscriptions).toBeInstanceOf(Map);
  expect(connection.subscriber.subscriptions.size).toBe(0);
  expect(typeof connection.subscriber.send).toBe('function');
  expect(connection.subscriber.i18n).toBe(context.i18n);
});

function setupHeldSubscribe() {
  const releases = [];
  const resolver = jest.fn(() => new Promise(() => {}));
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
  const send = jest.fn();
  const context = {
    rid: 'r',
    mode: 'prod',
    logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn() },
    handleError: jest.fn(),
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
  await Promise.resolve();
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
  const unsubscribeAll = jest.spyOn(registry, 'unsubscribeAll');

  const subscribed = connection.handleMessage(
    JSON.stringify({ type: 'subscribe', websocketId: 'chat', requestId: 's1' })
  );
  const afterClose = connection.handleMessage(
    JSON.stringify({ type: 'subscribe', websocketId: 'news', requestId: 's2' })
  );
  await Promise.resolve();
  connection.close();
  releases[0]();
  await Promise.all([subscribed, afterClose]);
  await Promise.resolve();

  expect(releases).toHaveLength(1);
  expect(unsubscribeAll).toHaveBeenCalledTimes(2);
  expect(connection.subscriber.subscriptions.size).toBe(0);
});
