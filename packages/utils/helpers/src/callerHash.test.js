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

// Fixed vectors: the same values are asserted by the server's stampCaller and
// the client's isOtherCaller tests, so both sides are pinned to one hash.
const vectors = [
  [{ id: 'user_1', organization_id: 'org_1' }, '82e92667feb5824d'],
  [{ id: 'user_1' }, '881f96c3592f330e'],
  [{ id: 'user_1', organization_id: null }, '881f96c3592f330e'],
  [{ id: 'ü漢😀', organization_id: 'o' }, '29da7252950344e9'],
];

test.each(vectors)('callerHash of %j is %s', (user, expected) => {
  expect(callerHash({ user })).toBe(expected);
});

test('callerHash is empty for an anonymous caller', () => {
  expect(callerHash({ user: null })).toBe('');
  expect(callerHash({ user: undefined })).toBe('');
});

test('callerHash is the first 16 hex characters of SHA-256 of user id and organization id', () => {
  // Lengths around the 55, 56 and 64 byte padding boundaries, and several blocks.
  [1, 20, 53, 54, 55, 56, 62, 63, 64, 65, 119, 120, 128, 300].forEach((length) => {
    const id = 'u'.repeat(length);
    expect(callerHash({ user: { id, organization_id: 'org' } })).toBe(
      createHash('sha256').update(`${id}:org`).digest('hex').slice(0, 16)
    );
  });
});

test('callerHash differs when only the organization changes', () => {
  const first = callerHash({ user: { id: 'user_1', organization_id: 'org_1' } });
  const second = callerHash({ user: { id: 'user_1', organization_id: 'org_2' } });
  expect(first).not.toBe(second);
  expect(first).toHaveLength(16);
});
