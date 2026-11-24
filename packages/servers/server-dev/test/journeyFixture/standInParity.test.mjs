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
import { fileURLToPath } from 'node:url';

import { classifyJourney } from '@lowdefy/node-utils';
import { expect, test } from 'vitest';
import YAML from 'yaml';

import { fixtureTest, postJourney } from './fixtureClient.mjs';

// The block stand-ins' parity journeys (LDF-1063): every journey in the fixture app's
// tests/journeys/_parity runs in the browser and again headless (postJourney's parity check), and
// must pass in both with the same end state. Each page appends every event it fires to state
// `log` as { event, payload }, and the check compares `log`, so a stand-in that fires a wrong
// event, fires one in the wrong order or sends a different payload fails its journey's parity.
// popups.yaml covers Modal, Drawer, ConfirmModal, DropdownButton, DropdownMenu and Menu on the
// popup_targets page; grids.yaml covers AgGrid and Table on grid_targets; clickable_html.yaml
// covers ClickableHtml on clickable_targets; search_selectors.yaml covers the searching selectors'
// fill on search_targets; input_events.yaml covers the onChange event a fill fires and a select by
// an html label's text on input_events; skeleton_loading.yaml covers content that mounts once a
// loading skeleton ends, on skeleton_loading; escape.yaml covers press Escape on the overlay that
// opened last, on escape_targets; plugin_block.yaml covers a plugin block method its meta declares
// a headless no-op, on plugin_block; text_targets.yaml covers text and containing targets inside a
// ClickableHtml, on text_targets; text_checks.yaml covers expect text read from blocks' text
// models, on text_checks; headless_gaps.yaml covers a NumberInput fill and Enter, and the steps a
// headless run leaves to the browser on a selector with onOpenChange actions, on a Table's search
// box and on a Table's value, on headless_gaps (LDF-1149).

const parityDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../../apps/journey-fixture/tests/journeys/_parity'
);

function readJourneys(file) {
  return YAML.parse(fs.readFileSync(path.join(parityDirectory, file), 'utf8')).map((journey) => [
    `${file}: ${journey.name}`,
    journey,
  ]);
}

const journeys = [
  ...readJourneys('popups.yaml'),
  ...readJourneys('grids.yaml'),
  ...readJourneys('clickable_html.yaml'),
  ...readJourneys('search_selectors.yaml'),
  ...readJourneys('input_events.yaml'),
  ...readJourneys('skeleton_loading.yaml'),
  ...readJourneys('escape.yaml'),
  ...readJourneys('plugin_block.yaml'),
  ...readJourneys('text_targets.yaml'),
  ...readJourneys('text_checks.yaml'),
  ...readJourneys('headless_gaps.yaml'),
];

// The journeys that must fail, in both runners at the same step, with what the browser's message
// says: the disabled button is found and refused, not missing.
const REFUSED_AT = {
  'grids.yaml: a Table button disabled by its when condition refuses the click': {
    index: 0,
    message: 'element is not enabled',
  },
  'search_selectors.yaml: a select of an option the search hides is refused': {
    index: 1,
    message: 'No option with text "Red" appeared',
  },
  'search_selectors.yaml: a fill on a Selector with search off is refused': {
    index: 0,
    message: 'element is not editable',
  },
  "escape.yaml: Escape closes a MultipleSelector's dropdown and keeps its search": {
    index: 2,
    message: 'No option with text "Red" appeared',
  },
  'text_targets.yaml: a text target that matches several ClickableHtml elements fails, naming them':
    {
      index: 0,
      message: 'Matched 2 controls with text "Open" in the page',
    },
  'text_targets.yaml: a containing target ignores case and fails on the two innermost elements it matches':
    {
      index: 0,
      message: 'Matched 2 elements containing "acme" in the page',
    },
  'text_checks.yaml: a text in a closed Modal is not found': {
    index: 0,
    message: 'Expected block "dialog" text to contain "Inside the dialog" but found ""',
  },
  "text_checks.yaml: an open Modal's text is not in the text of the block that holds it": {
    index: 1,
    message: 'Expected block "dialog_holder" text to contain "Inside the dialog" but found',
  },
  'text_checks.yaml: a text that never appears fails the same way': {
    index: 0,
    message: 'Expected block "company_card" text to contain "Beta Corp" but found',
  },
};

// The journeys a headless run must leave to the browser when the step runs, with what its reason
// says: the step names text no ClickableHtml shows, or clicks while a popover may cover it.
const BROWSER_ONLY_AT_RUN_TIME = {
  'text_targets.yaml: a text target no ClickableHtml shows runs in a browser':
    'Button "save_button" may show the text "Save"',
  'text_targets.yaml: a click while a ClickableHtml popover is open runs in a browser, which knows what it covers':
    'ClickableHtml "company_rows" has its popover open, which may cover what the step clicks',
  'text_checks.yaml: a text check on a block with no text model runs in a browser':
    'Block "plugin_area" holds blocks a headless run has no text model for (FixtureBadge "plugin_badge")',
  "headless_gaps.yaml: Enter after a number past a NumberInput's max runs in a browser, which clamps it":
    'Block "amount" (NumberInput) clamps 2000000 to its min and max as Enter is pressed',
  'headless_gaps.yaml: leaving a NumberInput past its max runs in a browser, which clamps it':
    'Block "amount" (NumberInput) clamps 2000000 to its min and max as the focus leaves it',
  'headless_gaps.yaml: a select on a MultipleSelector with onOpenChange actions runs in a browser':
    'Block "spaces_picker" (MultipleSelector) has onOpenChange actions',
  'headless_gaps.yaml: a click away from a Selector that opened itself runs in a browser':
    'Block "stage_picker" (Selector) opened its dropdown as it rendered (autoOpen)',
  'headless_gaps.yaml: a fill on a Table runs in a browser, which types into its search box':
    'Block "contacts_grid" (Table) is no input',
  "headless_gaps.yaml: a check on a Table's value runs in a browser, which writes it":
    'reads the value of Table "board_grid"',
};

// Each journey here must have run headless and matched, not been left to the browser, unless
// BROWSER_ONLY_AT_RUN_TIME lists it: the parity check records how it compared each journey
// (checkParity.mjs).
function expectComparedHeadless(name) {
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
  if (Object.hasOwn(BROWSER_ONLY_AT_RUN_TIME, name)) {
    expect(entries.map((entry) => entry.kind)).toEqual(['browser-only at run time']);
    expect(entries[0].reason).toContain(BROWSER_ONLY_AT_RUN_TIME[name]);
    return;
  }
  expect(entries.map((entry) => entry.kind)).toEqual(['same']);
}

test.each(journeys)('%s is a headless journey', (name, journey) => {
  expect(classifyJourney({ journey })).toEqual({ headless: true });
});

fixtureTest.each(journeys)('%s', async (name, journey) => {
  const result = await postJourney({
    pageId: journey.pageId,
    steps: journey.steps,
    state: ['log'],
    timeout: 5000,
  });
  if (Object.hasOwn(REFUSED_AT, name)) {
    expect(result.passed).toBe(false);
    expect(result.failure.index).toBe(REFUSED_AT[name].index);
    expect(result.failure.message).toContain(REFUSED_AT[name].message);
  } else {
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
  }
  expectComparedHeadless(name);
});
