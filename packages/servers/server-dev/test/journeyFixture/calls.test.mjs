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

import { expect } from 'vitest';

import { fixtureTest, postJourney, postJson } from './fixtureClient.mjs';

// The journey runner's call and request steps on the fixture app: page-less journeys that post
// to an endpoint as a data set user, read its answer and the data set database
// (apps/journey-fixture: auditor_only is gated to the auditor role, log_activity writes to
// fixture_db's items collection; the roles data set holds auditor and member).

fixtureTest(
  'a page-less journey as a member gets 403 and its error from the auditor endpoint',
  async () => {
    const result = await postJourney({
      data: 'roles',
      user: 'member',
      steps: [
        { call: { endpoint: 'auditor_only' } },
        { expect: { status: 403 } },
        { expect: { error: 'API Endpoint "auditor_only" does not exist.' } },
        { call: { endpoint: 'auditor_only', as: 'auditor' } },
        { expect: { status: 200 } },
        { call: { endpoint: 'auditor_only', as: 'none' } },
        { expect: { status: 401 } },
      ],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
    expect(result.pageId).toBeNull();
    expect(result.state).toBeUndefined();
  }
);

fixtureTest('a call an allowed user makes writes, and expect.db sees the write', async () => {
  const result = await postJourney({
    data: 'roles',
    user: 'member',
    steps: [
      { call: { endpoint: 'log_activity', payload: { source: 'journey-call' } } },
      { expect: { status: 200 } },
      {
        expect: {
          db: {
            collection: 'items',
            match: { kind: 'activity', source: 'journey-call' },
            count: 1,
          },
        },
      },
      {
        expect: {
          db: {
            collection: 'items',
            connectionId: 'fixture_db',
            match: { kind: 'activity' },
            equals: [{ kind: 'activity', source: 'journey-call' }],
          },
        },
      },
      { expect: { calls: { endpoint: 'log_activity', count: 1 } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.exercised.endpoints).toEqual([
    expect.objectContaining({ endpointId: 'log_activity' }),
  ]);
});

fixtureTest(
  'expect.db fails at its step when the database does not hold what it expects',
  async () => {
    const result = await postJourney({
      data: 'roles',
      user: 'member',
      timeout: 500,
      steps: [
        { call: { endpoint: 'log_activity', payload: { source: 'journey-call' } } },
        { expect: { db: { collection: 'items', match: { kind: 'activity' }, count: 2 } } },
      ],
    });
    expect(result.passed).toBe(false);
    expect(result.failure).toEqual(
      expect.objectContaining({
        index: 1,
        expected: 2,
        actual: 1,
        message: 'Expected 2 documents in "items" matching {"kind":"activity"} but found 1.',
      })
    );
  }
);

fixtureTest('a journey on a page runs a call step beside its page steps', async () => {
  const result = await postJourney({
    pageId: 'home',
    user: { roles: ['member'] },
    steps: [
      { call: { endpoint: 'auditor_only' } },
      { expect: { status: 403 } },
      { expect: { visible: 'home_title' } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest(
  'expect.calls on a payload is refused by the browser runner before a browser opens',
  async () => {
    const { status, body } = await postJson({
      path: '/lowdefy-docs/journey',
      body: {
        user: 'none',
        pageId: 'home',
        steps: [{ expect: { calls: { endpoint: 'log_activity', payload: { source: 'x' } } } }],
      },
    });
    expect(status).toBe(400);
    expect(body.error).toBe(
      'Step 0: expect.calls with "payload" or "response" needs a headless run (the browser runner does not record payloads yet).'
    );
  }
);
