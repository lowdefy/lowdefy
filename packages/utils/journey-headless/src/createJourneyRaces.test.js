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

import createJourneyRaces from './createJourneyRaces.js';

// A data session's pause gates, reached as a gated resolver reaches them (test-utils'
// holdAtPauseGate): the first open gate the request matches holds the routine until released.
function reach({ session, requestId, endpointId }) {
  const gate = session.pauseGates.find(
    (entry) =>
      !entry.reached &&
      !entry.released &&
      entry.requestId === requestId &&
      (entry.endpoint === undefined || entry.endpoint === endpointId)
  );
  if (gate === undefined) return Promise.resolve();
  gate.reached = true;
  gate.reachedBy = { requestId, endpointId, pageId: undefined };
  gate.arrive();
  return gate.whenReleased;
}

function setUp() {
  const session = { pauseGates: [] };
  const races = createJourneyRaces({ host: { dataSession: session } });
  let index = 0;
  function run(step, start) {
    const result = races.run({ index, step, start });
    index += 1;
    return result;
  }
  function call(endpointId) {
    return run({ call: { endpoint: endpointId } }, async () => {
      await reach({ session, requestId: 'claim', endpointId });
      return { endpointId };
    });
  }
  return { call, races, run, session };
}

async function holdBoth({ call, run }) {
  await run({ hold: { requestId: 'claim', endpoint: 'approve' } });
  await run({ hold: { requestId: 'claim', endpoint: 'reject' } });
  expect(await call('approve')).toEqual({ parkedAt: 'claim' });
  expect(await call('reject')).toEqual({ parkedAt: 'claim' });
}

test('createJourneyRaces releases two holds on one request id in different endpoints, the later first', async () => {
  const setup = setUp();
  await holdBoth(setup);
  const { races, run } = setup;
  expect(await run({ release: { requestId: 'claim', endpoint: 'reject' } })).toEqual({
    endpointId: 'reject',
  });
  expect(await run({ release: { requestId: 'claim', endpoint: 'approve' } })).toEqual({
    endpointId: 'approve',
  });
  expect(await races.finish()).toBeUndefined();
});

test('createJourneyRaces releases two holds on one request id in different endpoints, in the order held', async () => {
  const setup = setUp();
  await holdBoth(setup);
  const { races, run } = setup;
  expect(await run({ release: { requestId: 'claim', endpoint: 'approve' } })).toEqual({
    endpointId: 'approve',
  });
  expect(await run({ release: { requestId: 'claim', endpoint: 'reject' } })).toEqual({
    endpointId: 'reject',
  });
  expect(await races.finish()).toBeUndefined();
});

test('createJourneyRaces release by request id alone lets the first parked call go', async () => {
  const setup = setUp();
  await holdBoth(setup);
  const { races, run } = setup;
  expect(await run({ release: 'claim' })).toEqual({ endpointId: 'approve' });
  expect(await run({ release: 'claim' })).toEqual({ endpointId: 'reject' });
  expect(await races.finish()).toBeUndefined();
});

test('createJourneyRaces refuses a release whose endpoint no parked call reached', async () => {
  const { call, run, races } = setUp();
  await run({ hold: { requestId: 'claim', endpoint: 'approve' } });
  expect(await call('approve')).toEqual({ parkedAt: 'claim' });
  await expect(run({ release: { requestId: 'claim', endpoint: 'reject' } })).rejects.toThrow(
    'No call is parked at the gate on request "claim" on endpoint "reject" to release.'
  );
  const failure = await races.finish();
  expect(failure.message).toBe(
    'The call parked at the gate on request "claim" was still parked when the journey ended: release it with "release: { requestId: claim, endpoint: approve }".'
  );
});

test('createJourneyRaces names the hold whose gate no call reached when two share a request id', async () => {
  const { call, run, races } = setUp();
  await run({ hold: { requestId: 'claim', endpoint: 'approve' } });
  await run({ hold: { requestId: 'claim', endpoint: 'reject' } });
  expect(await call('reject')).toEqual({ parkedAt: 'claim' });
  expect(await run({ release: { requestId: 'claim', endpoint: 'reject' } })).toEqual({
    endpointId: 'reject',
  });
  const failure = await races.finish();
  expect(failure.index).toBe(0);
  expect(failure.step).toEqual({ hold: { requestId: 'claim', endpoint: 'approve' } });
});
