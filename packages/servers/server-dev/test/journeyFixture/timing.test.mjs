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

// wait.request waits for a call started since the last interaction, and a
// block that renders late is clicked through its control, over the fixture
// app's timing page.

fixtureTest(
  'wait.request with no interaction before it passes on the call the page made on open',
  async () => {
    const result = await postJourney({
      pageId: 'timing',
      steps: [{ wait: { request: 'load_items' } }],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
  }
);

fixtureTest('wait.request after a click that does not call the request times out', async () => {
  const result = await postJourney({
    pageId: 'timing',
    timeout: 1500,
    steps: [{ click: 'noop_button' }, { wait: { request: 'load_items' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(1);
  expect(result.failure.actual).toEqual(
    expect.objectContaining({ calledSinceLastInteraction: false })
  );
});

fixtureTest('wait.request after the click that calls the request passes', async () => {
  const result = await postJourney({
    pageId: 'timing',
    steps: [{ click: 'save_timing_button' }, { wait: { request: 'save_timing' } }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest(
  'a block that renders after the step starts is clicked through its control',
  async () => {
    const result = await postJourney({
      pageId: 'timing',
      timeout: 1500,
      steps: [
        { click: 'reveal_button' },
        { click: 'late_rows.0.row' },
        { expect: { state: { path: 'late_clicked', equals: true } } },
      ],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
  }
);

fixtureTest(
  'a lazy block that renders after the step starts is clicked through its control, not its fallback',
  async () => {
    const result = await postJourney({
      pageId: 'timing',
      steps: [
        { click: 'reveal_table_button' },
        { click: 'late_table' },
        { expect: { state: { path: 'late_table_picked', equals: true } } },
      ],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
  }
);
