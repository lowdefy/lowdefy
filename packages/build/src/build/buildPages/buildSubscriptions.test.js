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
import { ConfigWarning } from '@lowdefy/errors';

import buildPages from '../full/buildPages.js';
import testContext from '../../test-utils/testContext.js';

const auth = {
  public: true,
};

function createTestContext({ websocketIds = ['ws1'] } = {}) {
  const context = testContext();
  context.websocketIds = new Set(websocketIds);
  context.handleWarning = jest.fn();
  return context;
}

test('buildSubscriptions defaults page subscriptions to an empty array', () => {
  const context = createTestContext();
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res.pages[0].subscriptions).toEqual([]);
});

test('buildSubscriptions throws when subscriptions is not an array', () => {
  const context = createTestContext();
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: 'subscriptions',
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Subscriptions is not an array at page "page_1".'
  );
});

test('buildSubscriptions throws when subscription id is missing', () => {
  const context = createTestContext();
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [{}],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Subscription websocketId missing at page "page_1".'
  );
});

test('buildSubscriptions throws when subscription id is not a string', () => {
  const context = createTestContext();
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [{ websocketId: true }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Subscription websocketId is not a string at page "page_1".'
  );
});

test('buildSubscriptions throws when subscription references a websocket which does not exist', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [{ websocketId: 'missing_ws' }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Subscription "missing_ws" at page "page_1" references a websocket which does not exist.'
  );
});

test('buildSubscriptions throws on duplicate subscription ids on the same page', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [{ websocketId: 'ws1' }, { websocketId: 'ws1' }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Duplicate subscription "ws1" on page "page_1".'
  );
});

test('buildSubscriptions sets payload, client and events defaults on a valid subscription', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [{ websocketId: 'ws1' }],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res.pages[0].subscriptions).toEqual([
    {
      id: 'subscription:page_1:ws1',
      websocketId: 'ws1',
      pageId: 'page_1',
      payload: {},
      client: {
        maxMessages: 100,
        throttleRender: 250,
      },
      events: {},
    },
  ]);
});

test('buildSubscriptions throws when payload is not an object', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [{ websocketId: 'ws1', payload: 'payload' }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Subscription "ws1" at page "page_1" payload should be an object.'
  );
});

test('buildSubscriptions throws when client is not an object', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [{ websocketId: 'ws1', client: 'client' }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Subscription "ws1" at page "page_1" client should be an object.'
  );
});

test('buildSubscriptions throws when client.maxMessages is not a positive integer', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [{ websocketId: 'ws1', client: { maxMessages: 0 } }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Subscription "ws1" at page "page_1" client.maxMessages should be a positive integer.'
  );
});

test('buildSubscriptions throws when client.maxMessages is not an integer', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [{ websocketId: 'ws1', client: { maxMessages: 'many' } }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Subscription "ws1" at page "page_1" client.maxMessages should be a positive integer.'
  );
});

test('buildSubscriptions throws when client.throttleRender is not a number', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [{ websocketId: 'ws1', client: { throttleRender: 'fast' } }],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Subscription "ws1" at page "page_1" client.throttleRender should be a number.'
  );
});

test('buildSubscriptions clamps client.throttleRender below 100 to 100 and warns', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [{ websocketId: 'ws1', client: { throttleRender: 50 } }],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res.pages[0].subscriptions[0].client.throttleRender).toBe(100);
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  const warning = context.handleWarning.mock.calls[0][0];
  expect(warning).toBeInstanceOf(ConfigWarning);
  expect(warning.message).toBe(
    'Subscription "ws1" at page "page_1" client.throttleRender is below the minimum of 100ms and will be clamped.'
  );
});

test('buildSubscriptions keeps configured client values above the minimums', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [{ websocketId: 'ws1', client: { maxMessages: 5, throttleRender: 500 } }],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res.pages[0].subscriptions[0].client).toEqual({
    maxMessages: 5,
    throttleRender: 500,
  });
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('buildSubscriptions warns on unsupported event names which will never fire', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [
          {
            websocketId: 'ws1',
            events: {
              onFoo: [{ id: 'set_foo', type: 'SetState', params: { foo: true } }],
            },
          },
        ],
      },
    ],
  };
  buildPages({ components, context });
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  const warning = context.handleWarning.mock.calls[0][0];
  expect(warning).toBeInstanceOf(ConfigWarning);
  expect(warning.message).toBe(
    'Subscription "ws1" at page "page_1" has event "onFoo" which will never fire. Supported events: onMessage, onSubscribe, onError.'
  );
});

test('buildSubscriptions does not warn on supported event names', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [
          {
            websocketId: 'ws1',
            events: {
              onMessage: [{ id: 'set_message', type: 'SetState', params: { message: true } }],
              onSubscribe: [{ id: 'set_subscribed', type: 'SetState', params: { on: true } }],
              onError: [{ id: 'set_error', type: 'SetState', params: { error: true } }],
            },
          },
        ],
      },
    ],
  };
  buildPages({ components, context });
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('buildSubscriptions normalizes onMessage actions to try and catch and counts action types', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [
          {
            websocketId: 'ws1',
            events: {
              onMessage: [{ id: 'set_message', type: 'SetState', params: { message: true } }],
            },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res.pages[0].subscriptions[0].events).toEqual({
    onMessage: {
      try: [{ id: 'set_message', type: 'SetState', params: { message: true } }],
      catch: [],
    },
  });
  expect(context.typeCounters.actions.getCounts()).toEqual({ SetState: 1 });
});

test('buildSubscriptions counts client operators in payload and events', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [
          {
            websocketId: 'ws1',
            payload: {
              value: { _state: 'value' },
            },
            events: {
              onMessage: [
                {
                  id: 'set_message',
                  type: 'SetState',
                  params: { message: { _event: 'message' } },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  buildPages({ components, context });
  expect(context.typeCounters.operators.client.getCounts()).toEqual({
    _state: 1,
    _event: 1,
  });
});

test('buildSubscriptions renames subscription id to internal format with websocketId and pageId', () => {
  const context = createTestContext({ websocketIds: ['ws1', 'ws2'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [{ websocketId: 'ws1' }, { websocketId: 'ws2' }],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res.pages[0].subscriptions.map((s) => s.id)).toEqual([
    'subscription:page_1:ws1',
    'subscription:page_1:ws2',
  ]);
  expect(res.pages[0].subscriptions.map((s) => s.websocketId)).toEqual(['ws1', 'ws2']);
  expect(res.pages[0].subscriptions.map((s) => s.pageId)).toEqual(['page_1', 'page_1']);
});

test('buildSubscriptions allows the same subscription id on different pages', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        subscriptions: [{ websocketId: 'ws1' }],
      },
      {
        id: 'page_2',
        auth,
        type: 'Container',
        subscriptions: [{ websocketId: 'ws1' }],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(res.pages[0].subscriptions[0].id).toBe('subscription:page_1:ws1');
  expect(res.pages[1].subscriptions[0].id).toBe('subscription:page_2:ws1');
});

test('buildSubscriptions throws when a nested block defines subscriptions', () => {
  const context = createTestContext({ websocketIds: ['ws1'] });
  const components = {
    pages: [
      {
        id: 'page_1',
        auth,
        type: 'Container',
        blocks: [
          {
            id: 'box',
            type: 'Container',
            subscriptions: [{ websocketId: 'ws1' }],
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Subscriptions are only allowed on the page, not on block "box" on page "page_1".'
  );
});
