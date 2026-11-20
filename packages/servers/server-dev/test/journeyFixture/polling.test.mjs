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

import { fixtureTest, postJourney } from './fixtureClient.mjs';
import { expect } from 'vitest';

// An event that is only sleeping in a Wait the runner cannot outlast does not
// hold the page, over the fixture app's polling page: its onMountAsync chain
// sleeps a minute before it reads again. A Wait the runner can outlast still
// does.

// The settle after an interaction gives up at 5000 ms (SETTLE_TIMEOUT_MS in
// lib/docs/runJourneySteps.js); a step that took less did not wait it out.
const SETTLE_TIMEOUT_MS = 5000;

fixtureTest('a page whose only running event sleeps in a long Wait opens settled', async () => {
  const result = await postJourney({
    pageId: 'polling',
    steps: [{ expect: { visible: 'polling_title' } }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.ready).toBeUndefined();
  expect(result.note).toBeUndefined();
});

fixtureTest(
  'a click on a page whose event sleeps in a long Wait settles as soon as its own event is done',
  async () => {
    const result = await postJourney({
      pageId: 'polling',
      steps: [{ click: 'mark_button' }, { expect: { state: { path: 'marked', equals: true } } }],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
    expect(result.steps[0].durationMs).toBeLessThan(SETTLE_TIMEOUT_MS);
  }
);

fixtureTest('a click whose event sleeps in a short Wait is not settled until it ends', async () => {
  const result = await postJourney({
    pageId: 'polling',
    steps: [
      { click: 'slow_mark_button' },
      { expect: { state: { path: 'slow_marked', equals: true } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  // slow_mark_button waits 1500 ms before it sets the value.
  expect(result.steps[0].durationMs).toBeGreaterThanOrEqual(1500);
  expect(result.steps[0].durationMs).toBeLessThan(SETTLE_TIMEOUT_MS);
});
