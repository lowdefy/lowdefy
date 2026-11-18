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

function gate(fields) {
  return { requestId: 'save_price', message: 'Down', times: 1, fired: 0, ...fields };
}

test('findUnfiredFailGate passes when every fail gate fired', () => {
  const session = {
    failGates: [gate({ fired: 1 }), gate({ times: 'all', fired: 3 })],
    stubs: [stub({ answered: 2 }), { connectionType: 'AxiosHttp', requestType: 'AxiosHttp' }],
  };
  expect(findUnfiredFailGate({ session, steps })).toBeUndefined();
  expect(findUnfiredFailGate({ session: { failGates: [], stubs: [] }, steps })).toBeUndefined();
});

test('findUnfiredFailGate fails the last step naming the first gate that never fired', () => {
  const session = {
    stubs: [stub()],
    failGates: [
      gate({ fired: 1 }),
      gate({ requestId: 'claim_run', endpoint: 'approve_run', message: 'Claim failed', times: 2 }),
    ],
  };
  expect(findUnfiredFailGate({ session, steps })).toEqual({
    index: 1,
    step: steps[1],
    expected:
      'a request to reach the forced failure on request "claim_run" on endpoint "approve_run"',
    actual: 'no request reached it',
    message:
      'The forced failure on request "claim_run" on endpoint "approve_run" ("Claim failed") never fired: no request the journey made matched it, so nothing tested what it fails.',
  });
});

test('findUnfiredFailGate fails the last step naming the first answer stub that never answered', () => {
  const session = {
    failGates: [gate({ fired: 1 })],
    stubs: [
      stub({ answered: 1 }),
      stub({ requestId: 'fetch_rate', endpoint: 'price_run', pageId: 'home', match: { a: 1 } }),
      stub(),
    ],
  };
  expect(findUnfiredFailGate({ session, steps })).toEqual({
    index: 1,
    step: steps[1],
    expected:
      'a request to be answered by the AxiosHttp/AxiosHttp stub on request "fetch_rate" and endpoint "price_run" and page "home" and match {"a":1}',
    actual: 'no request reached it',
    message:
      'The AxiosHttp/AxiosHttp stub on request "fetch_rate" and endpoint "price_run" and page "home" and match {"a":1} never answered: no request the journey made matched it, or an earlier stub answered first, so nothing used its answer.',
  });
  expect(findUnfiredFailGate({ session: { failGates: [], stubs: [stub()] }, steps })).toMatchObject(
    {
      message:
        'The AxiosHttp/AxiosHttp stub never answered: no request the journey made matched it, or an earlier stub answered first, so nothing used its answer.',
    }
  );
});
