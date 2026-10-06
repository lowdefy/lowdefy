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
// connection the data set does not redirect, or run an auth action, is refused
// at that step before it acts. A click whose request uses the data set's
// MongoDB connection still works.

fixtureTest.each([
  [
    'external_button',
    'a click that reaches connection "rails_external" (AxiosHttp)',
    /Block "external_button" reaches connection "rails_external" \(AxiosHttp\)/,
  ],
  [
    'logout_button',
    'a click that runs the auth action Logout',
    /Block "logout_button" runs the auth action Logout/,
  ],
])('a data-set journey clicking %s is refused at that step', async (blockId, actual, message) => {
  const result = await postJourney({
    pageId: 'rails',
    data: 'rails',
    user: 'member',
    steps: [{ expect: { visible: 'rails_title' } }, { click: blockId }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(1);
  expect(result.failure.actual).toBe(actual);
  expect(result.failure.message).toMatch(message);
  // The click never happened, so no request reached the connection.
  expect(result.exercised.requests).toEqual([]);
});

fixtureTest('a data-set journey clicking a button found by its text is refused too', async () => {
  const result = await postJourney({
    pageId: 'rails',
    data: 'rails',
    user: 'member',
    steps: [{ click: { text: 'Call external' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.actual).toBe(
    'a click that reaches connection "rails_external" (AxiosHttp)'
  );
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
