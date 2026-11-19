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

import findUnfiredFailGate from './findUnfiredFailGate.js';

const steps = [{ call: { endpoint: 'price_run' } }, { expect: { status: 200 } }];

function stub(fields) {
  return {
    connectionType: 'AxiosHttp',
    requestType: 'AxiosHttp',
    answer: null,
    answered: 0,
    ...fields,
  };
}

function session(fields) {
  return { failGates: [], stubs: [], work: new Set(), ...fields };
}

function gate(fields) {
  return { requestId: 'save_price', message: 'Down', times: 1, fired: 0, ...fields };
}

test('findUnfiredFailGate passes when every fail gate fired and every named stub answered', async () => {
  const fired = session({
    failGates: [gate({ fired: 1 }), gate({ times: 'all', fired: 3 })],
    stubs: [stub({ answered: 2 }), { connectionType: 'AxiosHttp', requestType: 'AxiosHttp' }],
  });
  expect(await findUnfiredFailGate({ session: fired, steps })).toBeUndefined();
  expect(await findUnfiredFailGate({ session: session(), steps })).toBeUndefined();
});

test('findUnfiredFailGate fails the last step naming the first gate that never fired', async () => {
  const unfired = session({
    stubs: [stub({ requestId: 'fetch_rate' })],
    failGates: [
      gate({ fired: 1 }),
      gate({ requestId: 'claim_run', endpoint: 'approve_run', message: 'Claim failed', times: 2 }),
    ],
  });
  expect(await findUnfiredFailGate({ session: unfired, steps })).toEqual({
    index: 1,
    step: steps[1],
    expected:
      'a request to reach the forced failure on request "claim_run" on endpoint "approve_run"',
    actual: 'no request reached it',
    message:
      'The forced failure on request "claim_run" on endpoint "approve_run" ("Claim failed") never fired: no request the journey made matched it, so nothing tested what it fails.',
  });
});

test('findUnfiredFailGate fails the last step naming the first answer stub that names its request and never answered', async () => {
  const unanswered = session({
    failGates: [gate({ fired: 1 })],
    stubs: [
      stub({ answered: 1 }),
      stub(),
      stub({ requestId: 'fetch_rate', endpoint: 'price_run', pageId: 'home', match: { a: 1 } }),
    ],
  });
  expect(await findUnfiredFailGate({ session: unanswered, steps })).toEqual({
    index: 1,
    step: steps[1],
    expected:
      'a request to be answered by the AxiosHttp/AxiosHttp stub on request "fetch_rate" and endpoint "price_run" and page "home" and match {"a":1}',
    actual: 'no request reached it',
    message:
      'The AxiosHttp/AxiosHttp stub on request "fetch_rate" and endpoint "price_run" and page "home" and match {"a":1} never answered: no request the journey made matched it, or an earlier stub answered first, so nothing used its answer. A stub that names its request (requestId, endpoint, pageId or match) must answer; one keyed only by connectionType and requestType is a fallback and may go unused.',
  });
});

test('findUnfiredFailGate lets a fallback stub, keyed only by its types, go unused', async () => {
  expect(
    await findUnfiredFailGate({ session: session({ stubs: [stub()] }), steps })
  ).toBeUndefined();
});

test('findUnfiredFailGate counts a stub answered by background work that ends after the steps', async () => {
  const named = stub({ requestId: 'notify' });
  const background = session({ stubs: [named] });
  const work = new Promise((resolve) => {
    setTimeout(() => {
      named.answered += 1;
      resolve();
    }, 20);
  });
  background.work.add(work);
  work.then(() => background.work.delete(work));
  expect(await findUnfiredFailGate({ session: background, steps })).toBeUndefined();
});

test('findUnfiredFailGate counts a fail gate fired by background work that ends after the steps', async () => {
  const pending = gate({ requestId: 'notify' });
  const background = session({ failGates: [pending] });
  const work = new Promise((resolve) => {
    setTimeout(() => {
      pending.fired += 1;
      resolve();
    }, 20);
  });
  background.work.add(work);
  work.then(() => background.work.delete(work));
  expect(await findUnfiredFailGate({ session: background, steps })).toBeUndefined();
});

test('findUnfiredFailGate does not wait for background work when nothing is left to check', async () => {
  const neverEnds = new Promise(() => {});
  const cases = [
    session(),
    session({ stubs: [stub()] }),
    session({ failGates: [gate({ fired: 1 })], stubs: [stub({ requestId: 'a', answered: 1 })] }),
  ];
  for (const idle of cases) {
    idle.work.add(neverEnds);
    const started = Date.now();
    expect(await findUnfiredFailGate({ session: idle, steps })).toBeUndefined();
    expect(Date.now() - started).toBeLessThan(1000);
  }
});
