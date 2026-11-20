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

test('a subscribe resolves on the next tick and then calls onConnected', async () => {
  const reasons = [];
  const client = createInertWebSocketClient({ onBrowserOnly: (reason) => reasons.push(reason) });
  const calls = [];
  const subscribed = client.subscribe({
    websocketId: 'feed',
    payload: {},
    handlers: { onConnected: () => calls.push('onConnected') },
  });
  expect(calls).toEqual([]);
  await expect(subscribed).resolves.toBeUndefined();
  expect(calls).toEqual(['onConnected']);
  expect(reasons).toEqual([]);
});

test('an unsubscribe, or a subscribe that replaces it, settles a subscribe not yet answered with no onConnected', async () => {
  const client = createInertWebSocketClient({ onBrowserOnly: () => undefined });
  const calls = [];
  const first = client.subscribe({
    websocketId: 'feed',
    payload: {},
    handlers: { onConnected: () => calls.push('first') },
  });
  const second = client.subscribe({
    websocketId: 'feed',
    payload: { page: 2 },
    handlers: { onConnected: () => calls.push('second') },
  });
  await expect(first).resolves.toBeUndefined();
  await expect(second).resolves.toBeUndefined();
  const third = client.subscribe({
    websocketId: 'feed',
    payload: {},
    handlers: { onConnected: () => calls.push('third') },
  });
  expect(client.unsubscribe({ websocketId: 'feed' })).toBeUndefined();
  await expect(third).resolves.toBeUndefined();
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(calls).toEqual(['second']);
});

test('a publish tells onBrowserOnly and fails', async () => {
  const reasons = [];
  const client = createInertWebSocketClient({ onBrowserOnly: (reason) => reasons.push(reason) });
  await expect(client.publish({ websocketId: 'feed', payload: {} })).rejects.toThrow(
    'Publish to "feed" needs the browser.'
  );
  expect(reasons).toEqual(['Publish to "feed" needs the browser.']);
});

test('a page that subscribes on mount opens with no app error and fires onSubscribe after onMount starts', async () => {
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
    stepTimeout: 3000,
  });
  expect(result.failure).toBeUndefined();
  expect(result.browserOnly).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(errors).toEqual([]);
  // As in a browser, where the server's ack comes a round trip after the blocks mount.
  expect(readLog(log).map(([name]) => name)).toEqual(['onMount', 'onSubscribe']);
  // Neither the subscribe timeout (10 s) nor a settle cap (3 s here) is waited out.
  expect(Date.now() - started).toBeLessThan(2000);
});

test('a subscription with subscribeOnMount false opens on a Subscribe action, and no settle waits on it while it is closed', async () => {
  const started = Date.now();
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
    steps: [
      { expect: { visible: 'open_feed' } },
      { click: 'open_feed' },
      { click: 'close_feed' },
      { expect: { visible: 'open_feed' } },
    ],
    stepTimeout: 3000,
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(errors).toEqual([]);
  expect(readLog(log).map(([name]) => name)).toEqual(['onSubscribe']);
  // Each settle would wait its cap (3 s) on a declared channel that is not open.
  expect(Date.now() - started).toBeLessThan(2000);
});

// WebSockets.subscribe returns early for a channel already open with the same payload, so
// onSubscribe fires again only for a channel that was closed.
test('a link to the page shown keeps its subscriptions, and another page closes them', async () => {
  const { errors, log, result } = await runTestJourney({
    pages: [
      {
        id: 'home',
        subscriptions: [feed],
        blocks: [
          button({ id: 'stay', actions: [{ id: 'link', type: 'Link', params: 'home' }] }),
          button({ id: 'leave', actions: [{ id: 'link', type: 'Link', params: 'second' }] }),
        ],
      },
      {
        id: 'second',
        blocks: [
          button({ id: 'come_back', actions: [{ id: 'link', type: 'Link', params: 'home' }] }),
        ],
      },
    ],
    steps: [
      { click: 'stay' },
      { expect: { visible: 'stay' } },
      { click: 'leave' },
      { click: 'come_back' },
      { expect: { visible: 'stay' } },
    ],
  });
  expect(errors).toEqual([]);
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(readLog(log).map(([name]) => name)).toEqual(['onSubscribe', 'onSubscribe']);
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
