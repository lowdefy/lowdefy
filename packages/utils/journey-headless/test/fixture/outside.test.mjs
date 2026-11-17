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

import { afterEach, expect, test } from 'vitest';
import YAML from 'yaml';

import createBuildHost from '../../src/createBuildHost.js';
import runHeadlessJourney from '../../src/runHeadlessJourney.js';
import journeyFixture from './journeyFixture.mjs';

// System calls and webhooks over a production build of apps/journey-fixture, on data set
// "outside": close_runs is an InternalApi endpoint only a call as system reaches, and
// payment_events a webhook whose verify gate checks an HMAC of the raw body under the stand-in
// secret test-secret-FIXTURE_WEBHOOK_SECRET. Each journey runs on a host of its own, so on a fresh
// session of the data set.

function readJourney(name) {
  const [journey] = YAML.parse(
    fs.readFileSync(
      path.join(journeyFixture.configDirectory, 'tests', 'journeys', '_headless', name),
      'utf8'
    )
  );
  return journey;
}

const systemJourney = readJourney('system.yaml');
const webhookJourney = readJourney('webhook.yaml');

let host;

// A journey that names no user runs as the roleless default caller, as on the dev server.
async function run({ steps, user = {} }) {
  host = await createBuildHost({ ...journeyFixture, data: 'outside', user });
  return runHeadlessJourney({ host, journey: { steps }, stepTimeout: 2000 });
}

afterEach(async () => {
  await host?.close();
  host = undefined;
});

test('the system journey is refused without as: system and closes the runs with it', async () => {
  const result = await run({ steps: systemJourney.steps, user: systemJourney.user });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.steps.map((step) => step.status)).toEqual(systemJourney.steps.map(() => 'ok'));
  // The system call is recorded on a caller of its own, never on the journey's user.
  expect(
    result.calls.map(({ actor, endpointId, response, status }) => ({
      actor,
      endpointId,
      response,
      status,
    }))
  ).toEqual([
    { actor: 'main', endpointId: 'close_runs', response: null, status: 401 },
    { actor: 'system', endpointId: 'close_runs', response: { closed: 2 }, status: 200 },
  ]);
});

test('a signed-in caller cannot reach an InternalApi endpoint either: it answers as a missing one', async () => {
  const result = await run({
    steps: [{ call: { endpoint: 'close_runs' } }, { expect: { status: 200 } }],
    user: { id: 'u_admin', roles: ['auditor'] },
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toMatchObject({
    index: 0,
    message:
      'Step 0 (call) caused an app error: server-error: API Endpoint "close_runs" does not exist.',
  });
  expect(
    await host.findDocuments({ collection: 'items', match: { kind: 'run', closed: true } })
  ).toEqual([]);
});

test('the webhook journey writes the signed events and refuses the wrong signature', async () => {
  const result = await run({ steps: webhookJourney.steps });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.steps.map((step) => step.status)).toEqual(webhookJourney.steps.map(() => 'ok'));
});

test('a webhook step names an endpoint that is not a webhook', async () => {
  const result = await run({
    steps: [{ webhook: { endpoint: 'notify', body: {} } }, { expect: { status: 200 } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toMatchObject({
    index: 0,
    message:
      'Endpoint "notify" is not a webhook endpoint: a webhook step posts to an endpoint declared "webhook". Call it with a "call" step instead.',
  });
});
