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

import rolesHash from './rolesHash.js';

test('rolesHash is the stamp hash of the sorted, JSON-encoded roles', () => {
  expect(rolesHash({ user: { roles: ['editor', 'admin'] } })).toBe('e7019efa6ab2bf1d');
  expect(rolesHash({ user: { roles: ['editor', 'admin'] } })).toBe(
    createHash('sha256').update('["admin","editor"]').digest('hex').slice(0, 16)
  );
});

test('rolesHash hashes a caller with no roles as an empty list', () => {
  expect(rolesHash({ user: { roles: [] } })).toBe(rolesHash({ user: {} }));
});

test('rolesHash does not reorder the caller roles', () => {
  const roles = ['editor', 'admin'];
  rolesHash({ user: { roles } });
  expect(roles).toEqual(['editor', 'admin']);
});
