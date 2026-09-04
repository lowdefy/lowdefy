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
import validateAuthDev from './validateAuthDev.js';
import testContext from '../../test-utils/testContext.js';

function devContext() {
  const context = testContext();
  context.warnings = [];
  return context;
}

test('validateAuthDev passes when auth declares no dev block', () => {
  const context = devContext();
  expect(validateAuthDev({ components: { auth: {} }, context })).toEqual({ auth: {} });
  expect(context.warnings).toEqual([]);
});

test('validateAuthDev passes when browserUser names a declared dev user', () => {
  const context = devContext();
  const components = {
    auth: { dev: { browserUser: 'admin', users: { admin: { id: 'u1', roles: ['admin'] } } } },
  };
  validateAuthDev({ components, context });
  expect(context.warnings).toEqual([]);
});

test('validateAuthDev throws when browserUser does not name a declared dev user', () => {
  const context = devContext();
  const components = {
    auth: { dev: { browserUser: 'admn', users: { admin: {}, viewer: {} } } },
  };
  expect(() => validateAuthDev({ components, context })).toThrow(
    'Auth "dev.browserUser" names "admn", which is not declared under "dev.users". Declared: admin, viewer.'
  );
});

test('validateAuthDev throws when browserUser is set and no dev users are declared', () => {
  const context = devContext();
  const components = { auth: { dev: { browserUser: 'admin' } } };
  expect(() => validateAuthDev({ components, context })).toThrow(
    'Auth "dev.browserUser" names "admin", which is not declared under "dev.users". Declared: none.'
  );
});

test('validateAuthDev throws when browserUser is not a string', () => {
  const context = devContext();
  const components = { auth: { dev: { browserUser: { id: 'u1' }, users: { admin: {} } } } };
  expect(() => validateAuthDev({ components, context })).toThrow(
    'Auth "dev.browserUser" should be the name of a "dev.users" entry.'
  );
});

test('validateAuthDev throws when a prototype member name is used as browserUser', () => {
  const context = devContext();
  const components = { auth: { dev: { browserUser: 'constructor', users: { admin: {} } } } };
  expect(() => validateAuthDev({ components, context })).toThrow(
    'Auth "dev.browserUser" names "constructor", which is not declared under "dev.users". Declared: admin.'
  );
});

test('validateAuthDev warns that dev.mockUser is deprecated', () => {
  const context = devContext();
  const components = { auth: { dev: { mockUser: { id: 'u1', roles: ['admin'] } } } };
  validateAuthDev({ components, context });
  expect(context.warnings).toHaveLength(1);
  expect(context.warnings[0].message).toBe(
    'Auth "dev.mockUser" is deprecated and is removed in v9. Declare the caller as an entry under "dev.users" and select it with "dev.browserUser: <name>".'
  );
  expect(context.warnings[0].checkSlug).toBe('auth-dev-mock-user');
});

test('validateAuthDev throws when both dev.mockUser and dev.browserUser are declared', () => {
  const context = devContext();
  const components = {
    auth: { dev: { mockUser: { id: 'u1' }, browserUser: 'admin', users: { admin: {} } } },
  };
  expect(() => validateAuthDev({ components, context })).toThrow(
    'Auth "dev.mockUser" and "dev.browserUser" both name the browser\'s caller. Declare the user under "dev.users" and keep "dev.browserUser"; "dev.mockUser" is deprecated.'
  );
});
