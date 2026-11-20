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

import { expect, test } from 'vitest';

import createInertWebSocketClient from './createInertWebSocketClient.js';
import runTestJourney, { readLog, record } from './tests/runTestJourney.js';

function button({ id, actions }) {
  return { id, type: 'Button', events: { onClick: actions } };
}

const feed = {
  websocketId: 'feed',
  events: {
    onSubscribe: [record('onSubscribe')],
    onMessage: [{ id: 'got', type: 'SetState', params: { got_message: true } }],
  },
};

test('a subscribe resolves at once and calls onConnected, and an unsubscribe does nothing', async () => {
  const reasons = [];
  const client = createInertWebSocketClient({ onBrowserOnly: (reason) => reasons.push(reason) });
  const calls = [];
  await expect(
    client.subscribe({
      websocketId: 'feed',
      payload: {},
      handlers: { onConnected: () => calls.push('onConnected') },
    })
  ).resolves.toBeUndefined();
  expect(calls).toEqual(['onConnected']);
  expect(client.unsubscribe({ websocketId: 'feed' })).toBeUndefined();
  expect(reasons).toEqual([]);
});

test('a publish tells onBrowserOnly and fails', async () => {
  const reasons = [];
  const client = createInertWebSocketClient({ onBrowserOnly: (reason) => reasons.push(reason) });
  await expect(client.publish({ websocketId: 'feed', payload: {} })).rejects.toThrow(
    'Publish to "feed" needs the browser.'
  );
  expect(reasons).toEqual(['Publish to "feed" needs the browser.']);
});

test('a page that subscribes on mount opens with no app error and fires onSubscribe before onMount', async () => {
  const started = Date.now();
  const { errors, log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        subscriptions: [feed],
        events: { onMount: [record('onMount')] },
        blocks: [{ id: 'title', type: 'Paragraph' }],
      },
    ],
    steps: [{ expect: { visible: 'title' } }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.browserOnly).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(errors).toEqual([]);
  expect(readLog(log).map(([name]) => name)).toEqual(['onSubscribe', 'onMount']);
  // No subscribe timeout is waited out.
  expect(Date.now() - started).toBeLessThan(2000);
});

test('a subscription with subscribeOnMount false opens on a Subscribe action', async () => {
  const { errors, log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        subscriptions: [{ ...feed, client: { subscribeOnMount: false } }],
        blocks: [
          button({
            id: 'open_feed',
            actions: [{ id: 'subscribe', type: 'Subscribe', params: { websocketId: 'feed' } }],
          }),
          button({
            id: 'close_feed',
            actions: [{ id: 'unsubscribe', type: 'Unsubscribe', params: { websocketId: 'feed' } }],
          }),
        ],
      },
    ],
    steps: [{ click: 'open_feed' }, { click: 'close_feed' }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(errors).toEqual([]);
  expect(readLog(log).map(([name]) => name)).toEqual(['onSubscribe']);
});

test('a journey that waits on a live message fails on that wait', async () => {
  const { result } = await runTestJourney({
    pages: [{ id: 'home', subscriptions: [feed], blocks: [{ id: 'title', type: 'Paragraph' }] }],
    steps: [
      { expect: { visible: 'title' } },
      { expect: { state: { path: 'got_message', equals: true } } },
    ],
  });
  expect(result.passed).toBe(false);
  expect(result.browserOnly).toBeUndefined();
  expect(result.failure.index).toBe(1);
});

test('a Publish marks the journey browser-only at that step', async () => {
  const { result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        subscriptions: [feed],
        blocks: [
          button({
            id: 'send',
            actions: [{ id: 'publish', type: 'Publish', params: { websocketId: 'feed' } }],
          }),
        ],
      },
    ],
    steps: [{ click: 'send' }, { expect: { visible: 'send' } }],
  });
  expect(result.passed).toBeUndefined();
  expect(result.failure).toBeUndefined();
  expect(result.browserOnly).toEqual({
    index: 0,
    step: { click: 'send' },
    reason: 'Publish to "feed" needs the browser.',
  });
});
