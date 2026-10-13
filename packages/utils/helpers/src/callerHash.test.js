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

import { createHash } from 'node:crypto';

import callerHash from './callerHash.js';

function expected(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

test('callerHash is empty for an anonymous caller', async () => {
  await expect(callerHash({ user: null })).resolves.toBe('');
  await expect(callerHash({ user: undefined })).resolves.toBe('');
});

test('callerHash is the first 16 hex characters of SHA-256 of user id and organization id', async () => {
  await expect(callerHash({ user: { id: 'user_1', organization_id: 'org_1' } })).resolves.toBe(
    expected('user_1:org_1')
  );
});

test('callerHash uses an empty organization when the caller has none', async () => {
  await expect(callerHash({ user: { id: 'user_1' } })).resolves.toBe(expected('user_1:'));
  await expect(callerHash({ user: { id: 'user_1', organization_id: null } })).resolves.toBe(
    expected('user_1:')
  );
});

test('callerHash differs when only the organization changes', async () => {
  const first = await callerHash({ user: { id: 'user_1', organization_id: 'org_1' } });
  const second = await callerHash({ user: { id: 'user_1', organization_id: 'org_2' } });
  expect(first).not.toBe(second);
  expect(first).toHaveLength(16);
});
