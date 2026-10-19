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

// expect.effect, run by the real runner over the fixture app: it fails after
// a click that did nothing (a dead click), and passes after one
// that ran an event, navigated or called a request.

fixtureTest('expect.effect fails after a click on a button with no events', async () => {
  const result = await postJourney({
    pageId: 'explore',
    steps: [{ click: 'dead_button' }, { expect: { effect: true } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toEqual(
    expect.objectContaining({
      index: 1,
      step: { expect: { effect: true } },
      expected: 'the previous step to have an effect',
      actual: 'no event, no DOM change, no app request, URL unchanged',
    })
  );
  expect(result.steps.map((step) => step.status)).toEqual(['ok', 'failed']);
});

fixtureTest('expect.effect passes after a click whose onClick sets state', async () => {
  const result = await postJourney({
    pageId: 'home',
    steps: [{ click: 'count_button' }, { expect: { effect: true } }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('expect.effect passes after a click on a Link that navigates', async () => {
  const result = await postJourney({
    pageId: 'home',
    steps: [{ click: 'link_button' }, { expect: { effect: true } }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('expect.effect passes after a click that calls a request', async () => {
  const result = await postJourney({
    pageId: 'second',
    steps: [{ click: 'second_save_button' }, { expect: { effect: true } }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});
