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

import expectedAnswers from './expectedAnswers.js';
import expectedErrorNames from './expectedErrorNames.js';

test('expectedAnswers gives each expected outcome its status, warning line and page text', () => {
  expect(expectedAnswers).toEqual({
    AuthenticationError: { status: 401, warning: 'Unauthenticated request', text: 'Unauthorized' },
    AuthorizationError: { status: 403, warning: 'Forbidden', text: 'Forbidden' },
    TwoFactorEnrolmentRequiredError: {
      status: 403,
      warning: 'Two-factor enrolment required',
      text: 'Two-factor enrolment required',
    },
    UserError: { status: 400, warning: 'Bad request', text: 'Bad Request' },
  });
});

test('expectedAnswers answers every name isExpectedError accepts, and no other', () => {
  expect(Object.keys(expectedAnswers).sort()).toEqual([...expectedErrorNames].sort());
});
