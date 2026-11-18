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
function reach({ session, requestId, endpointId, pageId }) {
  const gate = session.pauseGates.find(
    (entry) =>
      !entry.reached &&
      !entry.released &&
      entry.requestId === requestId &&
      (entry.endpoint === undefined || entry.endpoint === endpointId)
  );
  if (gate === undefined) return Promise.resolve();
  gate.reached = true;
  gate.reachedBy = { requestId, endpointId, pageId };
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
  // A request on pageId (a routine of endpointId, when given), answering with label.
  function request({ pageId, endpointId, label }) {
    return run({ request: { requestId: 'claim', pageId } }, async () => {
      await reach({ session, requestId: 'claim', endpointId, pageId });
      return { pageId, endpointId, label };
    });
  }
  return { call, races, request, run, session };
}

async function holdBoth({ call, run }) {
  await run({ hold: { requestId: 'claim', endpoint: 'approve' } });
  await run({ hold: { requestId: 'claim', endpoint: 'reject' } });
  expect(await call('approve')).toEqual({
    parkedAt: 'claim',
    release: 'release: { requestId: claim, endpoint: approve }',
  });
  expect(await call('reject')).toEqual({
    parkedAt: 'claim',
    release: 'release: { requestId: claim, endpoint: reject }',
  });
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
  expect(await call('approve')).toEqual({
    parkedAt: 'claim',
    release: 'release: { requestId: claim, endpoint: approve }',
  });
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
  expect(await call('reject')).toEqual({
    parkedAt: 'claim',
    release: 'release: { requestId: claim, endpoint: reject }',
  });
  expect(await run({ release: { requestId: 'claim', endpoint: 'reject' } })).toEqual({
    endpointId: 'reject',
  });
  const failure = await races.finish();
  expect(failure.index).toBe(0);
  expect(failure.step).toEqual({ hold: { requestId: 'claim', endpoint: 'approve' } });
});

test('createJourneyRaces names a parked call by its own endpoint when two bare holds share a request id', async () => {
  const { call, run, races } = setUp();
  await run({ hold: { requestId: 'claim' } });
  await run({ hold: { requestId: 'claim' } });
  expect(await call('approve')).toEqual({
    parkedAt: 'claim',
    release: 'release: { requestId: claim, endpoint: approve }',
  });
  expect(await call('reject')).toEqual({
    parkedAt: 'claim',
    release: 'release: { requestId: claim, endpoint: reject }',
  });
  expect(await run({ release: { requestId: 'claim', endpoint: 'reject' } })).toEqual({
    endpointId: 'reject',
  });
  const failure = await races.finish();
  expect(failure.message).toBe(
    'The call parked at the gate on request "claim" was still parked when the journey ended: release it with "release: { requestId: claim, endpoint: approve }".'
  );
});

test('createJourneyRaces names a parked call by its request id alone when its hold is the only one on it', async () => {
  const { call, run } = setUp();
  await run({ hold: { requestId: 'claim' } });
  expect(await call('approve')).toEqual({ parkedAt: 'claim', release: 'release: claim' });
});

test('createJourneyRaces names the hold of each of two calls parked on one page at two bare holds', async () => {
  const { races, request, run } = setUp();
  await run({ hold: { requestId: 'claim' } });
  await run({ hold: { requestId: 'claim' } });
  // The first call's release is its own until the second call parks on the same one.
  expect(await request({ pageId: 'new-claim' })).toEqual({
    parkedAt: 'claim',
    release: 'release: { requestId: claim, pageId: new-claim }',
  });
  const second = await request({ pageId: 'new-claim' });
  expect(second).toEqual({
    parkedAt: 'claim',
    release: 'release: { requestId: claim, pageId: new-claim }',
    hold: 'the hold at step 1, once the call at step 2 is let go',
  });
  const failure = await races.finish();
  expect(failure.index).toBe(2);
  expect(failure.expected).toBe(
    'a "release: { requestId: claim, pageId: new-claim }" step to let the parked call go'
  );
  expect(failure.message).toBe(
    'The call parked at the gate on request "claim" was still parked when the journey ended: release it with "release: { requestId: claim, pageId: new-claim }" (the hold at step 0).'
  );
  expect(failure.message).not.toContain(second.hold);
});

test('createJourneyRaces lets the calls parked at two bare holds on one page go in the order they parked', async () => {
  const { races, request, run } = setUp();
  await run({ hold: { requestId: 'claim' } });
  await run({ hold: { requestId: 'claim' } });
  await request({ pageId: 'new-claim', label: 'first' });
  await request({ pageId: 'new-claim', label: 'second' });
  const release = { release: { requestId: 'claim', pageId: 'new-claim' } };
  expect((await run(release)).label).toBe('first');
  expect((await run(release)).label).toBe('second');
  expect(await races.finish()).toBeUndefined();
});

test('createJourneyRaces suggests the whole request when it tells two calls on one release apart', async () => {
  const { races, request, run } = setUp();
  await run({ hold: { requestId: 'claim' } });
  await run({ hold: { requestId: 'claim' } });
  expect(await request({ pageId: 'approvals', endpointId: 'approve' })).toEqual({
    parkedAt: 'claim',
    release: 'release: { requestId: claim, endpoint: approve }',
  });
  expect(await request({ pageId: 'claims', endpointId: 'approve' })).toEqual({
    parkedAt: 'claim',
    release: 'release: { requestId: claim, endpoint: approve, pageId: claims }',
    hold: 'the hold at step 1',
  });
  expect(
    await run({ release: { requestId: 'claim', endpoint: 'approve', pageId: 'claims' } })
  ).toEqual({ pageId: 'claims', endpointId: 'approve', label: undefined });
  const failure = await races.finish();
  expect(failure.message).toBe(
    'The call parked at the gate on request "claim" was still parked when the journey ended: release it with "release: { requestId: claim, endpoint: approve }".'
  );
});

test('createJourneyRaces names the hold when a release would let an earlier call of another hint go', async () => {
  const { races, request, run } = setUp();
  await run({ hold: { requestId: 'claim' } });
  await run({ hold: { requestId: 'claim' } });
  expect(await request({ pageId: 'claims', endpointId: 'approve', label: 'routine' })).toEqual({
    parkedAt: 'claim',
    release: 'release: { requestId: claim, endpoint: approve }',
  });
  // `release: { requestId: claim, pageId: claims }` also names the routine's call, parked first.
  expect(await request({ pageId: 'claims', label: 'page' })).toEqual({
    parkedAt: 'claim',
    release: 'release: { requestId: claim, pageId: claims }',
    hold: 'the hold at step 1, once the call at step 2 is let go',
  });
  const release = { release: { requestId: 'claim', pageId: 'claims' } };
  expect((await run(release)).label).toBe('routine');
  expect((await run(release)).label).toBe('page');
  expect(await races.finish()).toBeUndefined();
});

test('createJourneyRaces keeps a shared release hint true when the call ahead is let go by its own release', async () => {
  const { races, request, run } = setUp();
  await run({ hold: { requestId: 'claim' } });
  await run({ hold: { requestId: 'claim' } });
  expect(
    (await request({ pageId: 'claims', endpointId: 'approve', label: 'routine' })).release
  ).toBe('release: { requestId: claim, endpoint: approve }');
  // The page call's hint names the routine's call ahead of it, not a count of page releases, so
  // it stays true when the routine's call is let go by its own release first.
  expect(await request({ pageId: 'claims', label: 'page' })).toEqual({
    parkedAt: 'claim',
    release: 'release: { requestId: claim, pageId: claims }',
    hold: 'the hold at step 1, once the call at step 2 is let go',
  });
  expect((await run({ release: { requestId: 'claim', endpoint: 'approve' } })).label).toBe(
    'routine'
  );
  // The first page release after it lets the page call go.
  expect((await run({ release: { requestId: 'claim', pageId: 'claims' } })).label).toBe('page');
  expect(await races.finish()).toBeUndefined();
});

test('createJourneyRaces names every call parked ahead on a shared release', async () => {
  const { request, run } = setUp();
  await run({ hold: { requestId: 'claim' } });
  await run({ hold: { requestId: 'claim' } });
  await run({ hold: { requestId: 'claim' } });
  await request({ pageId: 'new-claim' });
  await request({ pageId: 'new-claim' });
  expect((await request({ pageId: 'new-claim' })).hold).toBe(
    'the hold at step 2, once the calls at steps 3 and 4 are let go'
  );
});
