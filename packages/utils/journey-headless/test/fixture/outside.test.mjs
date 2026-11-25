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

// System calls and webhooks over a production build of apps/journey-fixture, on data set
// "outside": close_runs is an InternalApi endpoint only a call as system reaches, and
// payment_events a webhook whose verify gate checks an HMAC of the raw body under the stand-in
// secret test-secret-FIXTURE_WEBHOOK_SECRET. Each journey runs on a host of its own on the file's
// one app, so on a fresh session of the data set.

function readJourney(name, index = 0) {
  return YAML.parse(
    fs.readFileSync(
      path.join(journeyFixture.configDirectory, 'tests', 'journeys', '_headless', name),
      'utf8'
    )
  )[index];
}

const systemJourney = readJourney('system.yaml');
const boundSystemJourney = readJourney('system.yaml', 1);
const credentialJourney = readJourney('credential.yaml');
const webhookJourney = readJourney('webhook.yaml');
const failedWebhookJourney = readJourney('webhook.yaml', 1);
const caughtWebhookJourney = readJourney('webhook.yaml', 2);

let app;
let host;

beforeAll(async () => {
  app = await openTestApp(journeyFixture);
});

afterAll(async () => {
  await app?.close();
});

async function run({ steps, stubs, user = 'operator' }) {
  host = await createBuildHost({ app, data: 'outside', stubs, user });
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
    { actor: 'user "none"', endpointId: 'close_runs', response: null, status: 401 },
    { actor: 'system', endpointId: 'close_runs', response: { closed: 2 }, status: 200 },
  ]);
});

test('a call bound to an organization runs as the stand-in caller a CallApi binds', async () => {
  const result = await run({ steps: boundSystemJourney.steps, user: boundSystemJourney.user });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.steps.map((step) => step.status)).toEqual(boundSystemJourney.steps.map(() => 'ok'));
  expect(result.calls.map(({ actor, endpointId }) => ({ actor, endpointId }))).toEqual([
    { actor: 'system', endpointId: 'record_caller' },
  ]);
});

test('a routine that marks a credential answers, in a credential scope of its own', async () => {
  const result = await run({ steps: credentialJourney.steps, user: credentialJourney.user });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.steps.map((step) => step.status)).toEqual(credentialJourney.steps.map(() => 'ok'));
});

test('what a call marked with _credential stays out of the journey result, a failure included', async () => {
  const marked = 'payload-credential-0042';
  const result = await run({
    steps: [
      { call: { endpoint: 'mark_credential', payload: { value: marked } } },
      { expect: { calls: { endpoint: 'mark_credential', response: { signature: 'another' } } } },
    ],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(1);
  expect(result.failure.actual).toEqual({
    signature: '[REDACTED]',
    token: '[REDACTED]',
  });
  expect(JSON.stringify(result)).not.toContain(marked);
  // The payload the call sent is scrubbed too: the value was marked in the call's scope.
  expect(result.calls[0].payload).toEqual({ value: '[REDACTED]' });
});

test('a system call bound to no organization whose routine fails says how to bind one', async () => {
  const result = await run({
    steps: [
      // BR-1 is a run of the data set, so the routine's insert fails on its _id.
      { call: { endpoint: 'record_caller', payload: { id: 'BR-1' }, as: 'system' } },
      { expect: { error: 'never in the answer' } },
    ],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toContain(
    'name them on the call, as: { system: { organization: <id>, caller: { id, name } } }.'
  );
});

test('the app error of a faulted system call bound to no organization says how to bind one', async () => {
  const result = await run({
    steps: [{ call: { endpoint: 'record_caller', payload: { id: 'BR-1' }, as: 'system' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(0);
  expect(result.failure.message).toContain('Step 0 (call) caused an app error');
  expect(result.failure.message).toContain(
    'name them on the call, as: { system: { organization: <id>, caller: { id, name } } }.'
  );
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

// Only a call step's `as: system` or `as: { system: { organization, caller } }` reaches the system
// principal. A user object written into the journey that carries "system" never does: as the call's
// caller it is refused before any call, and as the journey's user the server refuses it, so the
// InternalApi endpoint never runs.
test('an inline caller that carries "system" is refused before any call', async () => {
  const result = await run({
    steps: [
      {
        call: {
          endpoint: 'record_caller',
          payload: { id: 'inline' },
          as: { id: 'u_1', roles: ['admin'], system: true },
        },
      },
      { expect: { status: 200 } },
    ],
  });
  expect(result.passed).toBeUndefined();
  expect(result.error).toContain(
    'Step 0: Step "call" requires "as" with "system" to be { system: { organization, caller? } }'
  );
  expect(await host.findDocuments({ collection: 'items', match: { kind: 'caller' } })).toEqual([]);
});

// The build host reads the app's root config as the journey's user when it is made, so it is refused
// there, before any page opens or call runs; lowdefy test answers the journey refused.
test('a journey user that carries "system" is refused before the journey runs', async () => {
  await expect(
    run({
      steps: [
        { call: { endpoint: 'record_caller', payload: { id: 'journey_user' } } },
        { expect: { status: 200 } },
      ],
      user: { id: 'u_1', name: 'Nightly close', organization_id: 'org_a', system: true },
    })
  ).rejects.toThrow('An injected caller (dev mock user, headless or e2e user) can not carry "system".');
});

test('the webhook journey writes the signed events and refuses the wrong signature', async () => {
  const result = await run({ steps: webhookJourney.steps, user: webhookJourney.user });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.steps.map((step) => step.status)).toEqual(webhookJourney.steps.map(() => 'ok'));
});

test('expect.error reads the forced message of a fail gate inside a webhook routine', async () => {
  const result = await run({
    steps: failedWebhookJourney.steps,
    stubs: failedWebhookJourney.stubs,
    user: failedWebhookJourney.user,
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.steps.map((step) => step.status)).toEqual(
    failedWebhookJourney.steps.map(() => 'ok')
  );
});

test('a webhook whose routine catches a fault passes, judged by its answer', async () => {
  const result = await run({ steps: caughtWebhookJourney.steps, user: caughtWebhookJourney.user });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.steps.map((step) => step.status)).toEqual(
    caughtWebhookJourney.steps.map(() => 'ok')
  );
});

test("a webhook's caught fault is still listed on its answer, marked caught", async () => {
  host = await createBuildHost({ app, data: 'outside', user: 'operator' });
  const answer = await host.webhook({
    endpointId: 'caught_webhook',
    headers: {},
    query: {},
    rawBody: '{}',
  });
  expect(answer.status).toEqual(200);
  expect(answer.body).toEqual({ received: true });
  expect(answer.faults).toHaveLength(1);
  expect(answer.faults[0].caught).toBe(true);
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
