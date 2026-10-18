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

import {
  AuthenticationError,
  AuthorizationError,
  TwoFactorEnrolmentRequiredError,
  UserError,
} from '@lowdefy/errors';

import shouldReloadForAuthError from './shouldReloadForAuthError.js';
import createMemoryStore from './test/createMemoryStore.js';

const user = { id: 'user_1', organization_id: 'org_1' };

test('a 401 reloads while the page renders a user', () => {
  expect(
    shouldReloadForAuthError({
      error: new AuthenticationError(),
      reloadOnAuthorizationError: false,
      user,
      sessionStorage: createMemoryStore(),
    })
  ).toBe(true);
});

test('a 401 is not reloaded when the page renders no user', () => {
  expect(
    shouldReloadForAuthError({
      error: new AuthenticationError(),
      reloadOnAuthorizationError: true,
      user: null,
      sessionStorage: createMemoryStore(),
    })
  ).toBe(false);
});

test('a request 403 reloads, an endpoint 403 does not', () => {
  expect(
    shouldReloadForAuthError({
      error: new AuthorizationError('Request "save" does not exist.'),
      reloadOnAuthorizationError: true,
      user,
      sessionStorage: createMemoryStore(),
    })
  ).toBe(true);
  expect(
    shouldReloadForAuthError({
      error: new AuthorizationError('API Endpoint "save" does not exist.'),
      reloadOnAuthorizationError: false,
      user,
      sessionStorage: createMemoryStore(),
    })
  ).toBe(false);
});

test('a two-factor enrolment refusal and a UserError never reload', () => {
  [new TwoFactorEnrolmentRequiredError('Enrol.'), new UserError('Nope.')].forEach((error) => {
    expect(
      shouldReloadForAuthError({
        error,
        reloadOnAuthorizationError: true,
        user,
        sessionStorage: createMemoryStore(),
      })
    ).toBe(false);
  });
});

test('a second auth reload within the reload interval is refused', () => {
  const sessionStorage = createMemoryStore();
  const args = {
    error: new AuthenticationError(),
    reloadOnAuthorizationError: true,
    user,
    sessionStorage,
  };
  expect(shouldReloadForAuthError(args)).toBe(true);
  expect(shouldReloadForAuthError(args)).toBe(false);
});
