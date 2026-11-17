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

import listDeclaredRoles from './listDeclaredRoles.js';

function buildAuth(auth) {
  return { configured: true, roles: [], pages: { roles: {} }, api: { roles: {} }, ...auth };
}

test('listDeclaredRoles collects auth.roles ids and the roles the page and endpoint gates name, once each, sorted', () => {
  const authJson = buildAuth({
    roles: [{ id: 'finance' }, { id: 'admin' }],
    pages: { roles: { finance: ['billing'], viewer: ['home'] } },
    api: { roles: { technician: ['approve'], admin: ['purge'] } },
  });
  expect(listDeclaredRoles({ authJson })).toEqual(['admin', 'finance', 'technician', 'viewer']);
});

test('listDeclaredRoles returns no roles for an app that declares none', () => {
  expect(listDeclaredRoles({ authJson: buildAuth({ configured: false }) })).toEqual([]);
});

test('listDeclaredRoles keeps reserved ids as given, for createRoleUsers to prefix', () => {
  const authJson = buildAuth({
    roles: [{ id: 'none' }, { id: 'no-role' }],
    pages: { roles: { _ops: ['home'] } },
  });
  expect(listDeclaredRoles({ authJson })).toEqual(['_ops', 'no-role', 'none']);
});
