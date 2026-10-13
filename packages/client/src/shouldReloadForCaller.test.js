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

import { callerHash, callerStamp } from '@lowdefy/helpers';
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

const user = { id: 'user_1', organization_id: 'org_1', roles: ['editor', 'admin'] };

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

test('shouldReloadForCaller is false for the fixed full stamp of the rendered caller', () => {
  // The fixed vector callerStamp's own tests pin, so server and client agree.
  const serverCaller =
    '82e92667feb5824d; session=3a1d7b6848ba4816; roles=228d50a09b1b1e2b; memberships=476954726056d64d';
  expect(shouldReloadForCaller({ serverCaller, user, window: createWindow() })).toBe(false);
});

test('shouldReloadForCaller reloads when the server answered the rendered caller with other roles', () => {
  const serverCaller = callerStamp({ user: { ...user, roles: ['editor'] } });
  expect(shouldReloadForCaller({ serverCaller, user, window: createWindow() })).toBe(true);
});

test('shouldReloadForCaller reloads once for a roles change, then throws on a second', () => {
  const window = createWindow();
  const serverCaller = callerStamp({ user: { ...user, roles: [] } });
  expect(shouldReloadForCaller({ serverCaller, user, window })).toBe(true);
  expect(() => shouldReloadForCaller({ serverCaller, user, window })).toThrow(
    'The server answered with different roles than this page shows.'
  );
});

test('shouldReloadForCaller does not reload when only the session or memberships changed', () => {
  const window = createWindow();
  const first = callerStamp({
    user,
    authSession: { id: 'session_1', memberOrganizationIds: ['org_1'] },
  });
  const second = callerStamp({
    user,
    authSession: { id: 'session_2', memberOrganizationIds: ['org_1', 'org_2'] },
  });
  expect(shouldReloadForCaller({ serverCaller: first, user, window })).toBe(false);
  expect(shouldReloadForCaller({ serverCaller: second, user, window })).toBe(false);
});

test('shouldReloadForCaller does not reload an anonymous page answered anonymously', () => {
  expect(shouldReloadForCaller({ serverCaller: '', user: null, window: createWindow() })).toBe(
    false
  );
});

test('shouldReloadForCaller does not reload when the response names no caller', () => {
  expect(shouldReloadForCaller({ serverCaller: null, user, window: createWindow() })).toBe(false);
});
