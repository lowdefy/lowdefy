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

import fs from 'node:fs';
import path from 'node:path';

import { expect } from 'vitest';

import { fixtureTest, postJourney } from './fixtureClient.mjs';

// Popup stand-ins that must do what the component does in the browser (LDF-1094), each run in the
// browser and again headless (postJourney's parity check), over the fixture app's popup_parity
// page: a Modal with destroyOnHidden mounting its content on each open; a click inside a
// DropdownMenu's content, or on the block, reaching its trigger after the clicked button's
// onClick, which handles the click, so a click dropdown opens without its onOpenChange and a hover
// dropdown opens with it; a ColorSelector fill clicking its picker, and its Escape leaving an open
// dropdown open; and an open on a dropdown already open failing.

function stateIs(statePath, value) {
  return { expect: { state: { path: statePath, equals: value } } };
}

// Each journey here must have run headless and matched, not been left to the browser: the parity
// check records how it compared each journey (checkParity.mjs).
function expectComparedHeadless() {
  if (process.env.LOWDEFY_JOURNEY_FIXTURE_PARITY_SERVER === undefined) {
    return;
  }
  const recordPath = path.join(
    process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY,
    '.lowdefy',
    'parity',
    `${process.pid}.jsonl`
  );
  const testName = expect.getState().currentTestName;
  const entries = fs
    .readFileSync(recordPath, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
    .filter((entry) => entry.test === testName);
  expect(entries.map((entry) => entry.kind)).toEqual(['same']);
}

fixtureTest(
  'a Modal with destroyOnHidden mounts its content again when it opens again',
  async () => {
    const result = await postJourney({
      pageId: 'popup_parity',
      steps: [
        { click: 'open_reopen_modal_button' },
        stateIs('mounts', 1),
        { click: { blockId: 'reopen_modal', control: 'cancel' } },
        { expect: { hidden: 'reopen_modal_body' } },
        { click: 'open_reopen_modal_button' },
        stateIs('mounts', 2),
      ],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
    expectComparedHeadless();
  }
);

fixtureTest(
  'a click inside a closed click DropdownMenu content opens it, skipping its onOpenChange',
  async () => {
    const result = await postJourney({
      pageId: 'popup_parity',
      steps: [
        { click: 'profile_menu_button' },
        stateIs('profile_clicks', 1),
        stateIs('profile_open', null),
        // The dropdown is open: the click outside closes it, and that close fires.
        { click: 'elsewhere_button' },
        stateIs('last', 'elsewhere'),
        stateIs('profile_open', false),
      ],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
    expectComparedHeadless();
  }
);

fixtureTest('a click inside a closed hover DropdownMenu content opens it', async () => {
  const result = await postJourney({
    pageId: 'popup_parity',
    steps: [{ click: 'tools_button' }, stateIs('last', 'tools'), stateIs('tools_open', true)],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expectComparedHeadless();
});

fixtureTest('a click on a DropdownMenu lands on the button in its content', async () => {
  const result = await postJourney({
    pageId: 'popup_parity',
    steps: [
      { click: 'profile_menu' },
      stateIs('profile_clicks', 1),
      stateIs('profile_open', null),
      { click: 'elsewhere_button' },
      stateIs('profile_open', false),
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expectComparedHeadless();
});

fixtureTest(
  'a ColorSelector fill clicks its picker: a dropdown outside closes, the one holding it opens',
  async () => {
    const result = await postJourney({
      pageId: 'popup_parity',
      steps: [
        { open: 'profile_menu' },
        stateIs('profile_open', true),
        { fill: { blockId: 'tools_color', value: '#1677ff' } },
        stateIs('tools_color', '#1677ff'),
        stateIs('profile_open', false),
        // The Escape that closes the picker leaves the hover dropdown holding it open.
        stateIs('tools_open', true),
      ],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
    expectComparedHeadless();
  }
);

fixtureTest('an open on a dropdown that is already open fails', async () => {
  const result = await postJourney({
    pageId: 'popup_parity',
    timeout: 1000,
    steps: [{ open: 'tools_menu' }, { open: 'tools_menu' }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(1);
  expect(result.failure.message).toBe('Opening block "tools_menu" showed no dropdown or popup.');
  expectComparedHeadless();
});
