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

import { expect, test } from 'vitest';

import runHeadlessCall from './runHeadlessCall.js';

function createAnswer(status) {
  return {
    status,
    success: status === 200,
    response: status === 200 ? { ok: true } : null,
    error: null,
    body: status === 200 ? {} : { name: 'UserError', message: 'unknown_caller' },
    faults: [],
    detached: [],
  };
}

function createSetup({ status = 200 } = {}) {
  const systemCalls = [];
  const systemActor = { calls: [], system: true };
  const host = {
    dataSession: null,
    errorSink: { add: () => undefined },
    system: async (args) => {
      systemCalls.push(args);
      return createAnswer(status);
    },
  };
  const actors = { callerFor: async () => systemActor };
  return { actors, host, systemActor, systemCalls };
}

test('runHeadlessCall runs a call as system bound to no organization', async () => {
  const { actors, host, systemCalls } = createSetup();
  const answer = await runHeadlessCall({
    actors,
    host,
    step: { call: { endpoint: 'nightly_close', as: 'system' } },
  });
  expect(systemCalls).toEqual([
    { endpointId: 'nightly_close', payload: {}, organization: null, caller: null },
  ]);
  expect(answer).toEqual({
    description: 'endpoint "nightly_close"',
    error: null,
    hint: undefined,
    status: 200,
  });
});

test('runHeadlessCall passes the organization and stand-in caller the call names to the host', async () => {
  const { actors, host, systemActor, systemCalls } = createSetup();
  await runHeadlessCall({
    actors,
    host,
    step: {
      call: {
        endpoint: 'nightly_close',
        payload: { night: 'tue' },
        as: { system: { organization: 'org_a', caller: { id: 'job', name: 'Nightly job' } } },
      },
    },
  });
  expect(systemCalls).toEqual([
    {
      endpointId: 'nightly_close',
      payload: { night: 'tue' },
      organization: 'org_a',
      caller: { id: 'job', name: 'Nightly job' },
    },
  ]);
  expect(systemActor.calls).toMatchObject([{ endpointId: 'nightly_close', status: 200 }]);
});

test('runHeadlessCall hints at the binding when a call as system bound to no organization is refused', async () => {
  const { actors, host } = createSetup({ status: 400 });
  const answer = await runHeadlessCall({
    actors,
    host,
    step: { call: { endpoint: 'nightly_close', as: 'system' } },
  });
  expect(answer.hint).toEqual(
    'It ran as the system bound to no organization. An endpoint that runs per organization needs the binding a CallApi with "organization" and "caller" gives it: name them on the call, as: { system: { organization: <id>, caller: { id, name } } }.'
  );
});

test('runHeadlessCall gives no hint on a refused call bound to an organization', async () => {
  const { actors, host } = createSetup({ status: 400 });
  const answer = await runHeadlessCall({
    actors,
    host,
    step: { call: { endpoint: 'nightly_close', as: { system: { organization: 'org_a' } } } },
  });
  expect(answer.hint).toBeUndefined();
});
