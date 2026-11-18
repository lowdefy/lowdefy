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

import { beforeEach, expect, test, vi } from 'vitest';

import addPauseGate from './addPauseGate.js';
import createGatedResolver from './createGatedResolver.js';
import listUnreachedPauseGates from './listUnreachedPauseGates.js';
import raceToPauseGate from './raceToPauseGate.js';
import releasePauseGates from './releasePauseGates.js';

let session;
let resolver;
let gated;

beforeEach(() => {
  session = { failGates: [], pauseGates: [] };
  resolver = vi.fn(async (args) => `ran ${args.requestId}`);
  gated = createGatedResolver({ resolver, session });
});

test('raceToPauseGate answers the value of work that reaches no gate', async () => {
  addPauseGate({ requestId: 'claim_run', session });
  expect(await raceToPauseGate({ session, start: () => gated({ requestId: 'read_run' }) })).toEqual(
    { value: 'ran read_run' }
  );
});

test('raceToPauseGate answers the gate the work reached, and the work settles once it is released', async () => {
  // The routine takes its gate before its first await, so the race reads the open gates first.
  addPauseGate({ requestId: 'read_run', session });
  addPauseGate({ requestId: 'claim_run', endpoint: 'approve', session });
  const { gate, work } = await raceToPauseGate({
    session,
    start: () => gated({ requestId: 'claim_run', endpointId: 'approve' }),
  });
  expect(gate).toMatchObject({
    requestId: 'claim_run',
    endpoint: 'approve',
    reached: true,
    reachedBy: { requestId: 'claim_run', endpointId: 'approve' },
  });
  expect(resolver).not.toHaveBeenCalled();
  gate.release();
  expect(await work).toEqual('ran claim_run');
});

test('raceToPauseGate leaves out a gate already reached, so a second call races past it', async () => {
  addPauseGate({ requestId: 'claim_run', session });
  const first = await raceToPauseGate({
    session,
    start: () => gated({ requestId: 'claim_run' }),
  });
  expect(
    await raceToPauseGate({ session, start: () => gated({ requestId: 'claim_run' }) })
  ).toEqual({ value: 'ran claim_run' });
  releasePauseGates({ session });
  expect(await first.work).toEqual('ran claim_run');
});

test('raceToPauseGate rejects with work that fails before any gate is reached', async () => {
  addPauseGate({ requestId: 'claim_run', session });
  await expect(
    raceToPauseGate({ session, start: () => Promise.reject(new Error('Write failed.')) })
  ).rejects.toThrow('Write failed.');
});

test('listUnreachedPauseGates lists the gates no routine reached', async () => {
  addPauseGate({ requestId: 'claim_run', session });
  addPauseGate({ requestId: 'read_run', session });
  const { work } = await raceToPauseGate({
    session,
    start: () => gated({ requestId: 'claim_run' }),
  });
  expect(listUnreachedPauseGates({ session }).map((gate) => gate.requestId)).toEqual(['read_run']);
  releasePauseGates({ session });
  await work;
});
