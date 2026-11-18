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

// A fault a :catch of the routine handled is no app error, in the browser and headless alike
// (LDF-1077). caught_operator's :try step throws an OperatorError and its :catch answers with the
// error's name, so the journey judges that answer. postJourney runs it in the browser and checks it
// gives the same result headless on a production build (checkParity.mjs); the dev server's own
// headless host is asked too.

const CAUGHT_OPERATOR = {
  pageId: 'caught_faults',
  state: ['caught'],
  steps: [
    { click: 'caught_operator_button' },
    { expect: { state: { path: 'caught', equals: 'OperatorError' } } },
  ],
};

fixtureTest('a journey passes in the browser when a routine catches an OperatorError', async () => {
  const result = await postJourney(CAUGHT_OPERATOR);
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.state).toEqual({ caught: 'OperatorError' });
});

fixtureTest(
  'a journey passes on the dev server headless when a routine catches an OperatorError',
  async () => {
    const { status, body: result } = await postJson({
      path: '/lowdefy-docs/journey',
      body: { user: 'none', ...CAUGHT_OPERATOR, headless: true },
    });
    expect(status).toBe(200);
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
    expect(result.state).toEqual({ caught: 'OperatorError' });
  }
);
