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

import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import YAML from 'yaml';

import { openTestApp } from '@lowdefy/test-utils';

import createBuildHost from '../../src/createBuildHost.js';
import runHeadlessJourney from '../../src/runHeadlessJourney.js';
import journeyFixture from './journeyFixture.mjs';

// hold and release over a production build of apps/journey-fixture: two approve_run calls race
// for one run of data set "races", the first parked before claim_run. Each journey runs on a host
// of its own on the file's one app, so on a fresh session of the data set.

const [raceJourney] = YAML.parse(
  fs.readFileSync(
    path.join(journeyFixture.configDirectory, 'tests', 'journeys', '_headless', 'race.yaml'),
    'utf8'
  )
);

let app;
let host;

beforeAll(async () => {
  app = await openTestApp(journeyFixture);
});

afterAll(async () => {
  await app?.close();
});

async function run({ data = 'races', steps, user = 'finance' }) {
  host = await createBuildHost({ app, data, user });
  return runHeadlessJourney({ host, journey: { steps }, stepTimeout: 2000 });
}

afterEach(async () => {
  await host?.close();
  host = undefined;
});

test('the race journey parks the held call, the other claims the run, and release answers with the parked one', async () => {
  const result = await run({ steps: raceJourney.steps });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.steps.map((step) => step.status)).toEqual(raceJourney.steps.map(() => 'ok'));
  // Each call is recorded on its own actor; the parked one once release let it answer.
  const calls = result.calls.map(({ actor, endpointId, success }) => ({
    actor,
    endpointId,
    success,
  }));
  expect(calls).toHaveLength(2);
  expect(calls).toContainEqual({ actor: 'main', endpointId: 'approve_run', success: false });
  expect(calls).toContainEqual({
    actor: 'other_finance',
    endpointId: 'approve_run',
    success: true,
  });
  expect(host.dataSession.pauseGates).toEqual([]);
});

test('a gate no call reached fails the journey, naming its request', async () => {
  const result = await run({
    steps: [
      { hold: { requestId: 'claim_run', endpoint: 'log_activity' } },
      { call: { endpoint: 'approve_run', payload: { id: 'BR-1' } } },
      { expect: { status: 200 } },
    ],
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toEqual({
    index: 0,
    step: { hold: { requestId: 'claim_run', endpoint: 'log_activity' } },
    expected: 'a call or request step to reach the gate on request "claim_run"',
    actual: 'no call reached it',
    message:
      'No call reached the gate the hold on request "claim_run" set, so the race it sets up never ran.',
  });
  expect(result.steps.map((step) => step.status)).toEqual(['failed', 'ok', 'ok']);
});

test('a call still parked when the journey ends fails it, and the call is let go', async () => {
  const result = await run({
    steps: [
      { hold: { requestId: 'claim_run' } },
      { call: { endpoint: 'approve_run', payload: { id: 'BR-1' } } },
      { expect: { db: { collection: 'items', match: { approved_by: null }, count: 1 } } },
    ],
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toMatchObject({
    index: 1,
    message:
      'The call parked at the gate on request "claim_run" was still parked when the journey ended: release it with "release: claim_run".',
  });
  // Let go at the end, the call ran and was recorded.
  expect(result.calls).toMatchObject([{ actor: 'main', endpointId: 'approve_run', status: 200 }]);
  expect(host.dataSession.pauseGates).toEqual([]);
});

test('an expect step reads nothing from a parked call', async () => {
  const result = await run({
    steps: [
      { hold: { requestId: 'claim_run' } },
      { call: { endpoint: 'approve_run', payload: { id: 'BR-1' } } },
      { expect: { status: 200 } },
    ],
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toMatchObject({
    index: 2,
    message:
      'The call before this step is parked at the gate on request "claim_run" and has not answered: read its answer after "release: claim_run".',
  });
});

test('a click whose request reaches a gate fails the step, pointing to the doubleSubmit variant', async () => {
  host = await createBuildHost({ app, data: 'harden', user: 'member' });
  const result = await runHeadlessJourney({
    host,
    journey: {
      pageId: 'home',
      steps: [
        { hold: { requestId: 'save_item' } },
        { fill: { blockId: 'name_input', value: 'Held item' } },
        { click: 'save_button' },
      ],
    },
    stepTimeout: 2000,
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toMatchObject({
    index: 2,
    message:
      'Request "save_item" reached the gate a "hold" step set while a "click" step ran. Only a call or request step can be parked; a page that sends a request twice is tested by the doubleSubmit variant (lowdefy journeys variants).',
  });
  expect(host.dataSession.pauseGates).toEqual([]);
});

test('a release that names no gate a hold set is refused before any call', async () => {
  const result = await run({
    steps: [
      { call: { endpoint: 'approve_run', payload: { id: 'BR-1' } } },
      { release: 'claim_run' },
    ],
  });
  expect(result).toEqual({
    error:
      'Step 1: Step "release" names request "claim_run", which no "hold" step before it holds. A release lets go of the call a hold parked.',
  });
});

test('a release whose gate no call reached fails the step', async () => {
  const result = await run({
    steps: [
      { hold: { requestId: 'claim_run' } },
      { call: { endpoint: 'log_activity', payload: { source: 'race' } } },
      { release: 'claim_run' },
    ],
  });
  expect(result.failure).toMatchObject({
    index: 2,
    message:
      'No call reached the gate on request "claim_run", so no call is parked to release. A call or request step after the hold must reach it.',
  });
});

test('a release naming its hold by endpoint lets the call parked in that routine go', async () => {
  const key = { requestId: 'claim_run', endpoint: 'approve_run' };
  const steps = raceJourney.steps.map((step) => {
    if (step.release === 'claim_run') return { release: key };
    if (step.hold?.requestId === 'claim_run') return { hold: key };
    return step;
  });
  const result = await run({ steps });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(host.dataSession.pauseGates).toEqual([]);
});
