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

import validateVerifyEmailPage from './validateVerifyEmailPage.js';
import testContext from '../../test-utils/testContext.js';

function run({ auth, pages }) {
  const context = testContext();
  context.warnings = [];
  validateVerifyEmailPage({ components: { auth, pages }, context });
  return context.warnings.map((warning) => warning.message);
}

const emailAuth = {
  email: { connectionId: 'email' },
  emailAndPassword: { enabled: true },
  authPages: { verifyEmail: '/verify-email' },
};

test('validateVerifyEmailPage warns when verification email is sent and the page is missing', () => {
  expect(run({ auth: emailAuth, pages: [{ id: 'home' }] })).toEqual([
    'Auth "authPages.verifyEmail" is "/verify-email", but the app has no page "verify-email". Email verification links land there unless the SignUp or SendVerificationEmail action sets a callbackUrl. Add the page, or set authPages.verifyEmail to an existing one.',
  ]);
});

test.each([
  ['the page exists', emailAuth, [{ id: 'verify-email' }]],
  [
    'a module page is named',
    { ...emailAuth, authPages: { verifyEmail: '/crm/verify?from=email' } },
    [{ id: 'crm/verify' }],
  ],
  ['no auth email is configured', { ...emailAuth, email: undefined }, []],
  ['email and password is off', { ...emailAuth, emailAndPassword: { enabled: false } }, []],
  [
    'the page is another origin',
    { ...emailAuth, authPages: { verifyEmail: 'https://accounts.example.com/verified' } },
    [],
  ],
])('validateVerifyEmailPage does not warn when %s', (_, auth, pages) => {
  expect(run({ auth, pages })).toEqual([]);
});
