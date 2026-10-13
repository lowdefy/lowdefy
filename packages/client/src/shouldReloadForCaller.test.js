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

import { callerHash } from '@lowdefy/helpers';
import { AuthenticationError } from '@lowdefy/errors';

import shouldReloadForCaller from './shouldReloadForCaller.js';

function createWindow() {
  const stored = {};
  return {
    sessionStorage: {
      getItem: (key) => stored[key] ?? null,
      setItem: (key, value) => {
        stored[key] = value;
      },
    },
  };
}

const user = { id: 'user_1', organization_id: 'org_1' };

test('shouldReloadForCaller is false when the server answered as the rendered caller', () => {
  const serverCaller = callerHash({ user });
  expect(shouldReloadForCaller({ serverCaller, user, window: createWindow() })).toBe(false);
});

test('shouldReloadForCaller reloads once, then throws an AuthenticationError on a second difference', () => {
  const window = createWindow();
  const serverCaller = callerHash({ user: { id: 'user_2', organization_id: 'org_1' } });
  expect(shouldReloadForCaller({ serverCaller, user, window })).toBe(true);
  expect(() => shouldReloadForCaller({ serverCaller, user, window })).toThrow(AuthenticationError);
});
