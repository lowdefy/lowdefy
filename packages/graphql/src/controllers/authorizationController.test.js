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

test('authenticated true', async () => {
  const context = testBootstrapContext({});
  const authController = createAuthorizationController(context);
  expect(authController.authenticated).toBe(false);
});

test('authorize with user', async () => {
  const context = testBootstrapContext({ user: { sub: 'sub' } });
  const authController = createAuthorizationController(context);
  expect(authController.authorize({ auth: 'protected' })).toBe(true);
  expect(authController.authorize({ auth: 'public' })).toBe(true);
  expect(() => authController.authorize({ auth: 'other' })).toThrow(ServerError);
  expect(() => authController.authorize({})).toThrow(ServerError);
});

test('authorize without user', async () => {
  const context = testBootstrapContext({ user: {} });
  const authController = createAuthorizationController(context);
  expect(authController.authorize({ auth: 'protected' })).toBe(false);
  expect(authController.authorize({ auth: 'public' })).toBe(true);
  expect(() => authController.authorize({ auth: 'other' })).toThrow(ServerError);
  expect(() => authController.authorize({})).toThrow(ServerError);
});
