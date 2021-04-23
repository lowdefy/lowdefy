/*
  Copyright 2020-2021 Lowdefy, Inc

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

import createAuthorizationController from './authorizationController';

import { testBootstrapContext } from '../test/testContext';
import { ServerError } from '../context/errors';

test('authenticated true', async () => {
  const context = testBootstrapContext({ user: { sub: 'sub' } });
  const authController = createAuthorizationController(context);
  expect(authController.authenticated).toBe(true);
});

test('authenticated false', async () => {
  const context = testBootstrapContext({});
  const authController = createAuthorizationController(context);
  expect(authController.authenticated).toBe(false);
});

test('authorize public object', async () => {
  const auth = { public: true };

  let context = testBootstrapContext({});
  let authController = createAuthorizationController(context);
  expect(authController.authorize({ auth })).toBe(true);

  context = testBootstrapContext({ user: { sub: 'sub' } });
  authController = createAuthorizationController(context);
  expect(authController.authorize({ auth })).toBe(true);
});

test('authorize protected object, no roles', async () => {
  const auth = { public: false };

  let context = testBootstrapContext({});
  let authController = createAuthorizationController(context);
  expect(authController.authorize({ auth })).toBe(false);

  context = testBootstrapContext({ user: { sub: 'sub' } });
  authController = createAuthorizationController(context);
  expect(authController.authorize({ auth })).toBe(true);
});

test('authorize role protected object', async () => {
  const auth = { public: false, roles: ['role1'] };

  let context = testBootstrapContext({});
  let authController = createAuthorizationController(context);
  expect(authController.authorize({ auth })).toBe(false);

  context = testBootstrapContext({ user: { sub: 'sub' } });
  authController = createAuthorizationController(context);
  expect(authController.authorize({ auth })).toBe(false);

  context = testBootstrapContext({ user: { sub: 'sub' }, roles: [] });
  authController = createAuthorizationController(context);
  expect(authController.authorize({ auth })).toBe(false);

  context = testBootstrapContext({ user: { sub: 'sub' }, roles: ['role2'] });
  authController = createAuthorizationController(context);
  expect(authController.authorize({ auth })).toBe(false);

  context = testBootstrapContext({ user: { sub: 'sub' }, roles: ['role1'] });
  authController = createAuthorizationController(context);
  expect(authController.authorize({ auth })).toBe(true);

  context = testBootstrapContext({ user: { sub: 'sub' }, roles: ['role1', 'role2'] });
  authController = createAuthorizationController(context);
  expect(authController.authorize({ auth })).toBe(true);
});

test('invalid auth config', async () => {
  const context = testBootstrapContext({});
  const authController = createAuthorizationController(context);
  expect(() => authController.authorize({ auth: { other: 'value' } })).toThrow(ServerError);
  expect(() => authController.authorize({ auth: {} })).toThrow(ServerError);
  expect(() => authController.authorize({})).toThrow();
  expect(() => authController.authorize()).toThrow();
});
