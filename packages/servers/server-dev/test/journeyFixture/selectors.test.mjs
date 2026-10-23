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

// A select step ticks a CheckboxSelector's option by its exact label and never
// unticks one: run by the real runner over the fixture app's selectors page.

fixtureTest('select ticks two options of a CheckboxSelector', async () => {
  const result = await postJourney({
    pageId: 'selectors',
    steps: [
      { select: { blockId: 'regions', value: 'North' } },
      { select: { blockId: 'regions', value: 'South' } },
      { expect: { state: { path: 'regions', equals: ['North', 'South'] } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('select leaves a CheckboxSelector option that is already ticked', async () => {
  const result = await postJourney({
    pageId: 'selectors',
    steps: [
      { select: { blockId: 'regions', value: 'West' } },
      { select: { blockId: 'regions', value: 'West' } },
      { expect: { state: { path: 'regions', equals: ['West'] } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('select fails on a CheckboxSelector option that is not there', async () => {
  const result = await postJourney({
    pageId: 'selectors',
    timeout: 2000,
    steps: [{ select: { blockId: 'regions', value: 'East' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe('No option with text "East" in block "regions".');
});
