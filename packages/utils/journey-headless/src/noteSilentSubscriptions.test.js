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

import noteSilentSubscriptions from './noteSilentSubscriptions.js';

const failure = { index: 2, step: { expect: {} }, expected: 1, actual: 0, message: 'Expected 1.' };

function actorHolding(active) {
  return { page: { context: { _internal: { WebSockets: { active: new Set(active) } } } } };
}

test('noteSilentSubscriptions leaves a failure with no page as it is', () => {
  expect(noteSilentSubscriptions({ actor: { page: null }, failure })).toBe(failure);
});

test('noteSilentSubscriptions leaves a failure on a page holding no subscription as it is', () => {
  expect(noteSilentSubscriptions({ actor: actorHolding([]), failure })).toBe(failure);
});

test('noteSilentSubscriptions names every subscription the page holds open', () => {
  expect(noteSilentSubscriptions({ actor: actorHolding(['feed', 'alerts']), failure })).toEqual({
    ...failure,
    message:
      'Expected 1. The page holds websocket subscriptions "feed", "alerts", which get no messages headless: a step that waits on a live message passes only in a browser.',
  });
});
