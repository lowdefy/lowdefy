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

// A misspelt reference fails its step and names the id, checked against the
// fixture app's build before the step acts.

fixtureTest.each([
  [{ expect: { hidden: 'nosuchblock' } }, 'no block "nosuchblock"'],
  [{ expect: { calls: { request: 'nosuchrequest', count: 0 } } }, 'no request "nosuchrequest"'],
  [{ expect: { calls: { endpoint: 'nosuchendpoint', count: 0 } } }, 'no endpoint "nosuchendpoint"'],
  [{ wait: { request: 'nosuchrequest' } }, 'no request "nosuchrequest"'],
  [{ goto: 'nosuchpage' }, 'no page "nosuchpage"'],
])('%j fails at that step naming the unknown id', async (step, actual) => {
  const result = await postJourney({
    pageId: 'home',
    steps: [{ expect: { visible: 'home_title' } }, step],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(1);
  expect(result.failure.actual).toBe(actual);
});

fixtureTest('a list block target resolves through its template id', async () => {
  const result = await postJourney({
    pageId: 'home',
    steps: [
      { expect: { visible: 'rows.0.label' } },
      { fill: { blockId: 'rows.1.label', value: 'Edited row' } },
      { expect: { state: { path: 'rows.1.label', equals: 'Edited row' } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('an as name the data set does not declare fails naming it and the users', async () => {
  const result = await postJourney({
    pageId: 'explore',
    data: 'explore',
    user: 'member',
    steps: [{ expect: { visible: 'explore' } }, { as: 'membr' }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(1);
  expect(result.failure.actual).toBe('no data set user "membr"');
  expect(result.failure.message).toMatch('Known users: member.');
});
