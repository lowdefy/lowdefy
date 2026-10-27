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

import setLowdefyUser from './setLowdefyUser.js';
import { expect, test } from 'vitest';

function createLowdefy() {
  return { _internal: {}, apiResponses: {}, lowdefyGlobal: { theme: 'dark' }, user: null };
}

test('setLowdefyUser sets the rendered caller', () => {
  const lowdefy = createLowdefy();
  const user = { id: 'user_1', organization_id: 'org_1' };
  setLowdefyUser({ lowdefy, user });
  expect(lowdefy.user).toBe(user);
  setLowdefyUser({ lowdefy, user: undefined });
  expect(lowdefy.user).toBe(null);
});

test('setLowdefyUser keeps CallAPI results while the organization is unchanged', () => {
  const lowdefy = createLowdefy();
  setLowdefyUser({ lowdefy, user: { id: 'user_1', organization_id: 'org_1' } });
  const results = { list: [{ response: [1] }] };
  lowdefy.apiResponses = results;
  setLowdefyUser({ lowdefy, user: { id: 'user_1', organization_id: 'org_1', roles: ['admin'] } });
  expect(lowdefy.apiResponses).toBe(results);
});

test('setLowdefyUser drops CallAPI results when the organization changes, and leaves global state', () => {
  const lowdefy = createLowdefy();
  setLowdefyUser({ lowdefy, user: { id: 'user_1', organization_id: 'org_1' } });
  lowdefy.apiResponses = { list: [{ response: ['org one'] }] };
  setLowdefyUser({ lowdefy, user: { id: 'user_1', organization_id: 'org_2' } });
  expect(lowdefy.apiResponses).toEqual({});
  expect(lowdefy.lowdefyGlobal).toEqual({ theme: 'dark' });
});

test('setLowdefyUser drops CallAPI results when the caller leaves its organization', () => {
  const lowdefy = createLowdefy();
  setLowdefyUser({ lowdefy, user: { id: 'user_1', organization_id: 'org_1' } });
  lowdefy.apiResponses = { list: [{ response: ['org one'] }] };
  setLowdefyUser({ lowdefy, user: { id: 'user_1', organization_id: null } });
  expect(lowdefy.apiResponses).toEqual({});
});

test('setLowdefyUser keeps results fetched with no organization when the caller gains one', () => {
  const lowdefy = createLowdefy();
  setLowdefyUser({ lowdefy, user: { id: 'user_1' } });
  const results = { invitation: [{ response: { ok: true } }] };
  lowdefy.apiResponses = results;
  setLowdefyUser({ lowdefy, user: { id: 'user_1', organization_id: 'org_1' } });
  expect(lowdefy.apiResponses).toBe(results);
  // From then on they belong to that organization.
  setLowdefyUser({ lowdefy, user: { id: 'user_1', organization_id: 'org_2' } });
  expect(lowdefy.apiResponses).toEqual({});
});
