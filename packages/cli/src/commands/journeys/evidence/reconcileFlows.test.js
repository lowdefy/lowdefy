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

import flowLines from './flowLines.js';
import reconcileFlows from './reconcileFlows.js';
import sequenceId from './sequenceId.js';

const today = '2026-10-05';
const oldSteps = [{ click: { blockId: 'assign', text: 'Assign' } }, { click: 'save' }];
const newSteps = [{ click: { blockId: 'assign', text: 'Give to' } }, { click: 'save' }];
const months = [{ month: '2026-09', days: 30, sessions: 4, persons: 2, orgs: 1, failures: 0 }];

function flow(steps) {
  return {
    sequence: sequenceId({ pageId: 'tickets', steps }),
    pageId: 'tickets',
    flow: flowLines({ pageId: 'tickets', steps }),
  };
}

function journey({ steps, production }) {
  return { name: 'assigns', pageId: 'tickets', steps, evidence: { production } };
}

test('reconcileFlows starts a journey with no monthly evidence from empty', () => {
  expect(reconcileFlows({ journey: { pageId: 'tickets', steps: oldSteps }, today })).toEqual({
    live: { ...flow(oldSteps), months: [] },
    deprecated: [],
    recount: false,
  });
});

test('reconcileFlows replaces the legacy window shape with empty months', () => {
  const legacy = { sessions: 9, persons: 2, orgs: 1, share: 0.5, failures: 0, window: 'x/y' };
  expect(
    reconcileFlows({ journey: journey({ steps: oldSteps, production: legacy }), today })
  ).toEqual({ live: { ...flow(oldSteps), months: [] }, deprecated: [], recount: false });
});

test('reconcileFlows keeps the months of an unchanged flow', () => {
  const production = { ...flow(oldSteps), months };
  expect(reconcileFlows({ journey: journey({ steps: oldSteps, production }), today })).toEqual({
    live: production,
    deprecated: [],
    recount: false,
  });
});

test('reconcileFlows deprecates a changed flow with its months and starts the new one empty', () => {
  const production = { ...flow(oldSteps), months };
  expect(reconcileFlows({ journey: journey({ steps: newSteps, production }), today })).toEqual({
    live: { ...flow(newSteps), months: [] },
    deprecated: [{ ...flow(oldSteps), replaced: today, months }],
    recount: false,
  });
});

test('reconcileFlows revives a deprecated flow the steps went back to', () => {
  const newMonths = [{ ...months[0], sessions: 1 }];
  const production = {
    ...flow(newSteps),
    months: newMonths,
    deprecated: [{ ...flow(oldSteps), replaced: '2026-10-01', months }],
  };
  expect(reconcileFlows({ journey: journey({ steps: oldSteps, production }), today })).toEqual({
    live: { ...flow(oldSteps), months },
    deprecated: [{ ...flow(newSteps), replaced: today, months: newMonths }],
    recount: false,
  });
});

test('reconcileFlows rehashes a flow stored under an older matcher without deprecating it', () => {
  const oldVersion = { sequence: 'v0-12345678', pageId: 'tickets', flow: ['tickets x'] };
  const production = {
    ...oldVersion,
    months,
    deprecated: [{ ...oldVersion, sequence: 'v0-87654321', replaced: '2026-01-01', months }],
  };
  expect(reconcileFlows({ journey: journey({ steps: oldSteps, production }), today })).toEqual({
    live: { ...flow(oldSteps), months },
    deprecated: production.deprecated,
    recount: true,
  });
});
