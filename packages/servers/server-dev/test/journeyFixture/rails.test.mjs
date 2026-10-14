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

import { fixtureTest, postJourney } from './fixtureClient.mjs';

// The data-set rails: on a journey with a data set, a click that would reach a
// connection whose type declares nothing or has no artifact, or run an auth
// action, is refused at that step before it acts. A click whose request uses
// the data set's MongoDB connection (which declares redirect) works, and one
// whose request uses an external connection (AxiosHttp) works too: the request
// is sunk, recorded on the result and never sent.

fixtureTest('a data-set journey clicking logout_button is refused at that step', async () => {
  const result = await postJourney({
    pageId: 'rails',
    data: 'rails',
    user: 'member',
    steps: [{ expect: { visible: 'rails_title' } }, { click: 'logout_button' }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(1);
  expect(result.failure.actual).toBe('a click that runs the auth action Logout');
  expect(result.failure.message).toMatch(/Block "logout_button" runs the auth action Logout/);
  // The click never happened, so no request reached the connection.
  expect(result.exercised.requests).toEqual([]);
});

// The request's connection is an AxiosHttp pointed at a port nothing listens on: a request that
// was sent would fail the journey with a connection error. Under a data session it is sunk.
fixtureTest.each([
  ['by block id', { click: 'external_button' }],
  ['by its text', { click: { text: 'Call external' } }],
])('a data-set journey clicking an external request %s sinks it', async (_, click) => {
  const result = await postJourney({
    pageId: 'rails',
    data: 'rails',
    user: 'member',
    steps: [{ expect: { visible: 'rails_title' } }, click, { wait: { request: 'call_external' } }],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.sunk).toEqual([
    expect.objectContaining({
      connectionId: 'rails_external',
      connectionType: 'AxiosHttp',
      requestType: 'AxiosHttp',
      requestId: 'call_external',
      pageId: 'rails',
    }),
  ]);
});

fixtureTest('a data-set journey clicking a button whose request uses MongoDB passes', async () => {
  const result = await postJourney({
    pageId: 'rails',
    data: 'rails',
    user: 'member',
    steps: [
      { click: 'save_rail_button' },
      { wait: { request: 'save_rail_item' } },
      { expect: { visible: 'rail_saved_alert' } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('a journey without a data set is not railed', async () => {
  const result = await postJourney({
    pageId: 'rails',
    steps: [{ click: 'logout_button' }],
  });
  expect(result.failure?.actual ?? '').not.toMatch('auth action');
});
