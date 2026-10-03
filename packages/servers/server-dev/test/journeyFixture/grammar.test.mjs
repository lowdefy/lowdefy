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

// expect.hidden, expect.calls and click.count, run by the real runner over the
// fixture app.

fixtureTest('expect.hidden passes for an absent and an invisible target', async () => {
  const result = await postJourney({
    pageId: 'home',
    steps: [
      { expect: { visible: 'home_title' } },
      { expect: { hidden: 'no_such_block' } },
      // Mounted inside a forceRender modal that never opened.
      { expect: { hidden: 'forced_text' } },
      { expect: { hidden: { blockId: 'home_title', containing: 'Another title' } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('expect.hidden fails for a visible target', async () => {
  const result = await postJourney({
    pageId: 'home',
    timeout: 1000,
    steps: [{ expect: { hidden: { blockId: 'home_title', containing: 'Journey fixture' } } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe(
    'Expected block "home_title" text containing "Journey fixture" to be hidden.'
  );
});

fixtureTest('expect.calls counts 0 and then 1 across a full reload', async () => {
  const result = await postJourney({
    pageId: 'home',
    steps: [
      { expect: { calls: { request: 'save_item', count: 0 } } },
      { fill: { blockId: 'name_input', value: 'Counted item' } },
      { click: 'save_button' },
      { wait: { request: 'save_item' } },
      { goto: 'home' },
      { expect: { calls: { request: 'save_item', pageId: 'home', count: 1 } } },
      { expect: { calls: { endpoint: 'notify', count: 0 } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest(
  "expect.calls tells two pages' save requests apart, defaulting to the current page",
  async () => {
    const result = await postJourney({
      pageId: 'home',
      steps: [
        { fill: { blockId: 'name_input', value: 'Home item' } },
        { click: 'save_button' },
        { wait: { request: 'save_item' } },
        { click: 'link_button' },
        { click: 'second_save_button' },
        { wait: { request: 'save_item' } },
        { click: 'second_save_button' },
        { wait: { request: 'save_item' } },
        { expect: { calls: { request: 'save_item', count: 2 } } },
        { expect: { calls: { request: 'save_item', pageId: 'home', count: 1 } } },
        { expect: { calls: { request: 'save_item', pageId: 'second', count: 3 } } },
      ],
    });
    expect(result.failure).toEqual(expect.objectContaining({ index: 10 }));
    expect(result.failure.message).toBe(
      'Expected request "save_item" on page "second" to have been called 3 times but it was called 2 times.'
    );
    expect(result.failure.expected).toBe(3);
    expect(result.failure.actual).toBe(2);
  }
);

fixtureTest('click.count: 2 sends two clicks before the settle', async () => {
  const result = await postJourney({
    pageId: 'home',
    steps: [
      { click: { blockId: 'count_button', count: 2 } },
      { expect: { state: { path: 'clicks', equals: 2 } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});
