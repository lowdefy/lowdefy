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

import addJourneyStubs from './addJourneyStubs.js';

function createSession() {
  return { stubs: [], failGates: [] };
}

test('addJourneyStubs sets answer stubs and fail gates on the session in the order written', () => {
  const session = createSession();
  addJourneyStubs({
    session,
    stubs: [
      {
        connectionType: 'AxiosHttp',
        requestType: 'AxiosHttp',
        endpoint: 'price_run',
        match: { params: { currency: 'EUR' } },
        answer: { rate: 1.5 },
      },
      { requestId: 'save_price', endpoint: 'price_run', fail: 'Write failed on purpose' },
      { requestId: 'claim_run', fail: 'Claim failed on purpose', times: 2 },
      { requestId: 'insert_activity', pageId: 'home', fail: 'Down', times: 'all' },
    ],
  });
  expect(session.stubs).toEqual([
    {
      connectionType: 'AxiosHttp',
      requestType: 'AxiosHttp',
      answer: { rate: 1.5 },
      requestId: undefined,
      endpoint: 'price_run',
      pageId: undefined,
      match: { params: { currency: 'EUR' } },
      answered: 0,
    },
  ]);
  expect(session.failGates).toEqual([
    {
      requestId: 'save_price',
      endpoint: 'price_run',
      pageId: undefined,
      message: 'Write failed on purpose',
      times: 1,
      fired: 0,
    },
    {
      requestId: 'claim_run',
      endpoint: undefined,
      pageId: undefined,
      message: 'Claim failed on purpose',
      times: 2,
      fired: 0,
    },
    {
      requestId: 'insert_activity',
      endpoint: undefined,
      pageId: 'home',
      message: 'Down',
      times: 'all',
      fired: 0,
    },
  ]);
});

test('addJourneyStubs sets nothing for a journey with no stubs', () => {
  const session = createSession();
  addJourneyStubs({ session, stubs: undefined });
  expect(session.stubs).toEqual([]);
  expect(session.failGates).toEqual([]);
});
