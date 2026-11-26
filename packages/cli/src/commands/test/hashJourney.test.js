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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect, test } from 'vitest';

import discoverJourneys from './discoverJourneys.js';
import expandJourney from './expandJourney.js';
import hashJourney from './hashJourney.js';

const journey = {
  name: 'Save an order',
  pageId: 'orders',
  data: 'shop',
  user: 'owner',
  pathParams: { id: '1' },
  urlQuery: { tab: 'items' },
  steps: [{ click: 'save' }],
};

test('hashJourney ignores what does not change the run: name, tags, evidence', () => {
  expect(
    hashJourney({
      ...journey,
      name: 'Renamed',
      tags: ['smoke'],
      evidence: { production: { months: [] } },
    })
  ).toEqual(hashJourney(journey));
});

test('hashJourney changes when any field the run reads changes', () => {
  const base = hashJourney(journey);
  [
    { pageId: 'refunds' },
    { data: 'other' },
    { user: 'clerk' },
    { pathParams: { id: '2' } },
    { urlQuery: {} },
    { steps: [{ click: 'cancel' }] },
  ].forEach((change) => {
    expect(hashJourney({ ...journey, ...change })).not.toEqual(base);
  });
});

test('hashJourney changes when a stub changes, and a journey without stubs keeps its hash', () => {
  const stub = { connectionType: 'AxiosHttp', requestType: 'AxiosHttp', answer: { ok: true } };
  const base = hashJourney(journey);
  const stubbed = hashJourney({ ...journey, stubs: [stub] });
  expect(stubbed).not.toEqual(base);
  expect(hashJourney({ ...journey, stubs: [{ ...stub, answer: { ok: false } }] })).not.toEqual(
    stubbed
  );
  // The hash journeys had before stubs, so committed exercised.json entries stay current.
  expect(base).toBe('45e11cc0fe00f5aa045581549d2506e31a610dbf');
});

test('hashJourney hashes the expanded run, so a changed referred file or case row changes it', () => {
  const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-hash-journey-'));
  const journeysDirectory = path.join(configDirectory, 'tests', 'journeys');
  fs.mkdirSync(journeysDirectory, { recursive: true });
  fs.mkdirSync(path.join(configDirectory, 'tests', 'shared'));
  const context = { directories: { config: configDirectory, journeys: journeysDirectory } };
  function runHashes({ steps, cases }) {
    fs.writeFileSync(path.join(configDirectory, 'tests', 'shared', 'steps.yaml'), steps);
    fs.writeFileSync(path.join(configDirectory, 'tests', 'shared', 'cases.yaml'), cases);
    return discoverJourneys({ context })
      .flatMap((item) => expandJourney({ item }))
      .map((item) => hashJourney(item.journey));
  }
  try {
    fs.writeFileSync(
      path.join(journeysDirectory, 'a.yaml'),
      'name: calls\ncases:\n  _ref: tests/shared/cases.yaml\nsteps:\n  _ref: tests/shared/steps.yaml\n'
    );
    const steps = '- call: { endpoint: { _case: endpoint } }\n- expect: { status: 200 }\n';
    const cases = '- { name: one, endpoint: save }\n- { name: two, endpoint: send }\n';
    const before = runHashes({ steps, cases });
    expect(before).toHaveLength(2);
    expect(before[0]).not.toEqual(before[1]);
    const changedSteps = runHashes({ steps: steps.replace('200', '201'), cases });
    expect(changedSteps[0]).not.toEqual(before[0]);
    expect(changedSteps[1]).not.toEqual(before[1]);
    const changedRow = runHashes({ steps, cases: cases.replace('send', 'post') });
    expect(changedRow).toEqual([before[0], expect.not.stringMatching(before[1])]);
  } finally {
    fs.rmSync(configDirectory, { recursive: true, force: true });
  }
});
