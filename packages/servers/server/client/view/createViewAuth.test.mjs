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

import createViewAuth from './createViewAuth.js';

const authConfig = { configured: true };
const user = { id: 'user-1' };

test('createViewAuth carries the user and the auth config', () => {
  const auth = createViewAuth({ authConfig, user });
  expect(auth.user).toBe(user);
  expect(auth.authConfig).toBe(authConfig);
});

test('createViewAuth refuses every auth method with the reason', () => {
  const auth = createViewAuth({ authConfig, user });
  const methods = Object.keys(auth).filter((key) => typeof auth[key] === 'function');
  expect(methods).toEqual(expect.arrayContaining(['signInEmail', 'signOut', 'getResolvedUser']));
  methods.forEach((method) => {
    expect(() => auth[method]()).toThrow(
      'Auth actions are not available in an MCP App view. The view is signed in by its host.'
    );
  });
});
