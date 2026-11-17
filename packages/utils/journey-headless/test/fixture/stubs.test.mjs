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

// A journey's stubs over a production build of apps/journey-fixture: an answer stub for the rate
// service price_run asks, and fail gates that fail a write once, twice and every time, on data set
// "stubs". Each journey runs on a host of its own on the file's one app, so on a fresh session.

const [stubsJourney, pageJourney] = YAML.parse(
  fs.readFileSync(
    path.join(journeyFixture.configDirectory, 'tests', 'journeys', '_headless', 'stubs.yaml'),
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

async function run({ pageId, steps, stubs }) {
  host = await createBuildHost({ app, data: 'stubs', stubs, user: 'finance' });
  return runHeadlessJourney({ host, journey: { pageId, steps }, stepTimeout: 2000 });
}

afterEach(async () => {
  await host?.close();
  host = undefined;
});

test('the stubs journey answers the rate service, and its forced failures read as their messages', async () => {
  const result = await run(stubsJourney);
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.steps.map((step) => step.status)).toEqual(stubsJourney.steps.map(() => 'ok'));
  expect(host.dataSession.failGates.map(({ requestId, fired }) => ({ requestId, fired }))).toEqual([
    { requestId: 'save_price', fired: 1 },
    { requestId: 'claim_run', fired: 2 },
    { requestId: 'insert_activity', fired: 2 },
  ]);
  // The client sees the generic message; the forced one is the server's record of the call.
  const forced = result.calls.filter((call) => call.success === false);
  expect(forced).toHaveLength(5);
  forced.forEach((call) => {
    expect(call.error.message).not.toContain('on purpose');
  });
});

test('a fail gate that never fired fails the journey at its last step, naming the gate', async () => {
  const steps = [
    { call: { endpoint: 'price_run', payload: { id: 'BR-1', currency: 'EUR' } } },
    { expect: { status: 200 } },
  ];
  const result = await run({
    steps,
    stubs: [
      stubsJourney.stubs[0],
      { requestId: 'claim_run', endpoint: 'approve_run', fail: 'Never reached' },
    ],
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toEqual({
    index: 1,
    step: steps[1],
    expected:
      'a request to reach the forced failure on request "claim_run" on endpoint "approve_run"',
    actual: 'no request reached it',
    message:
      'The forced failure on request "claim_run" on endpoint "approve_run" ("Never reached") never fired: no request the journey made matched it, so nothing tested what it fails.',
  });
  expect(result.steps.map((step) => step.status)).toEqual(['ok', 'failed']);
});

test('expect.error after a forced failure fails on text the forced message does not hold', async () => {
  const steps = [
    { call: { endpoint: 'price_run', payload: { id: 'BR-1', currency: 'EUR' } } },
    { expect: { error: 'Some other text' } },
  ];
  const result = await run({ steps, stubs: stubsJourney.stubs.slice(0, 2) });
  expect(result.passed).toBe(false);
  expect(result.failure).toMatchObject({
    index: 1,
    message:
      'Expected endpoint "price_run" to answer with an error containing "Some other text" but its error was "Price write failed on purpose".',
  });
});

test('a page request a click fires and a fail gate fails is no app error', async () => {
  const result = await run(pageJourney);
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.steps.map((step) => step.status)).toEqual(pageJourney.steps.map(() => 'ok'));
  expect(host.dataSession.failGates).toMatchObject([{ requestId: 'save_item', fired: 1 }]);
  expect(result.calls).toMatchObject([
    { kind: 'request', requestId: 'save_item', status: 500, success: false },
  ]);
});
