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

import createRoleUsers from './createRoleUsers.js';

test('createRoleUsers gives one user per role holding only it, and a no-role user', () => {
  expect(createRoleUsers({ roles: ['finance', 'technician'] })).toEqual({
    finance: { id: 'finance', roles: ['finance'] },
    'no-role': { id: 'no-role', roles: [] },
    technician: { id: 'technician', roles: ['technician'] },
  });
});

test('createRoleUsers gives only the no-role user when the app declares no roles', () => {
  expect(createRoleUsers({ roles: [] })).toEqual({ 'no-role': { id: 'no-role', roles: [] } });
});

test('createRoleUsers prefixes role-none, role-no-role and roles starting with "_"', () => {
  expect(createRoleUsers({ roles: ['_internal', 'no-role', 'none'] })).toEqual({
    'no-role': { id: 'no-role', roles: [] },
    'role-_internal': { id: 'role-_internal', roles: ['_internal'] },
    'role-no-role': { id: 'role-no-role', roles: ['no-role'] },
    'role-none': { id: 'role-none', roles: ['none'] },
  });
});

test('createRoleUsers prefixes again when the prefixed name is another role', () => {
  expect(createRoleUsers({ roles: ['none', 'role-none'] })).toEqual({
    'no-role': { id: 'no-role', roles: [] },
    'role-none': { id: 'role-none', roles: ['none'] },
    'role-role-none': { id: 'role-role-none', roles: ['role-none'] },
  });
});
