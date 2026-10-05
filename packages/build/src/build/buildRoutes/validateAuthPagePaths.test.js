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

import buildRoutes from './buildRoutes.js';
import validateAuthPagePaths from './validateAuthPagePaths.js';
import testContext from '../../test-utils/testContext.js';

function run(components) {
  const context = testContext();
  context.errors = [];
  buildRoutes({ components, context });
  validateAuthPagePaths({ components, context });
  return context.errors.map((error) => error.message);
}

test('validateAuthPagePaths refuses placeholders on the sign-in page', () => {
  const errors = run({
    auth: { authPages: { signIn: '/login' } },
    pages: [{ id: 'login', type: 'Box', path: '{tenant}/login' }],
  });
  expect(errors).toEqual([
    'Page "login" is the "auth.authPages.signIn" page, so its path "{tenant}/login" cannot have placeholders. Auth pages are redirect targets, with no values to fill them.',
  ]);
});

test('validateAuthPagePaths refuses placeholders on a module-contributed auth page', () => {
  const errors = run({
    auth: { authPages: { signIn: '/accounts/login' } },
    pages: [{ id: 'accounts/login', type: 'Box', path: 'accounts/{tenant}/login' }],
  });
  expect(errors).toHaveLength(1);
  expect(errors[0]).toMatch('Page "accounts/login" is the "auth.authPages.signIn" page');
});

test('validateAuthPagePaths finds the auth page by its path, with a query string', () => {
  const errors = run({
    auth: { authPages: { verifyEmail: '/{tenant}/verify?step=1' } },
    pages: [{ id: 'verify', type: 'Box', path: '{tenant}/verify' }],
  });
  expect(errors).toHaveLength(1);
  expect(errors[0]).toMatch('Page "verify" is the "auth.authPages.verifyEmail" page');
});

test('validateAuthPagePaths accepts auth pages with fixed paths, absolute URLs and unpatterned pages', () => {
  const errors = run({
    auth: {
      authPages: {
        signIn: '/login',
        signUp: '/signup',
        error: 'https://example.com/auth-error',
      },
    },
    pages: [
      { id: 'login', type: 'Box', path: 'sign-in' },
      { id: 'signup', type: 'Box' },
      { id: 'ticket', type: 'Box', path: 'tickets/{id}' },
    ],
  });
  expect(errors).toEqual([]);
});
