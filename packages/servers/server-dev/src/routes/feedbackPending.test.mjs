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

import { Hono } from 'hono';

const { default: feedbackPendingHandler } = await import('./feedbackPending.js');
const { default: feedbackStore } = await import('../../lib/docs/feedbackStore.js');

function createApp() {
  const app = new Hono();
  app.get('/lowdefy-docs/feedback-pending', feedbackPendingHandler);
  return app;
}

afterEach(() => {
  feedbackStore.clear();
});

test('feedbackPendingHandler without consume peeks the queue without draining it', async () => {
  feedbackStore.push({ pageId: 'login', annotations: [] });

  const res = await createApp().request('/lowdefy-docs/feedback-pending');
  const body = await res.json();

  expect(body.count).toEqual(1);
  expect(body.items).toEqual([{ pageId: 'login', annotations: [] }]);
  expect(typeof body.formatted).toEqual('string');
  expect(feedbackStore.count()).toEqual(1);
});

test('feedbackPendingHandler with consume=1 drains the queue', async () => {
  feedbackStore.push({ pageId: 'login', annotations: [] });

  const res = await createApp().request('/lowdefy-docs/feedback-pending?consume=1');
  const body = await res.json();

  expect(body.count).toEqual(1);
  expect(feedbackStore.count()).toEqual(0);
});

test('feedbackPendingHandler returns the no-pending-feedback message when the queue is empty', async () => {
  const res = await createApp().request('/lowdefy-docs/feedback-pending');
  const body = await res.json();

  expect(body.count).toEqual(0);
  expect(body.items).toEqual([]);
  expect(body.formatted).toMatch(/No pending feedback/);
});

test('feedbackPendingHandler succeeds without an Origin header (local curl, not a browser tab)', async () => {
  const res = await createApp().request('/lowdefy-docs/feedback-pending');
  expect(res.status).toEqual(200);
});
