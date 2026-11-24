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
// loading skeleton ends, on skeleton_loading.

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
};

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
  expectComparedHeadless();
});
