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

import buildRoleCatalog from './buildRoleCatalog.js';

test('buildRoleCatalog writes an empty catalog when no roles are declared', () => {
  const components = {
    auth: {
      pages: { roles: {} },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  const res = buildRoleCatalog({ components });
  expect(res.auth.roles).toEqual([]);
});

test('buildRoleCatalog collects the union of page, api and websocket role names sorted', () => {
  const components = {
    auth: {
      pages: { roles: { admin: ['admin-*'], auditor: ['reports'] } },
      api: { roles: { admin: ['admin-api'], 'branch-manager': ['branches'] } },
      websockets: { roles: { operator: ['live-feed'] } },
    },
  };
  const res = buildRoleCatalog({ components });
  expect(res.auth.roles).toEqual(['admin', 'auditor', 'branch-manager', 'operator']);
});

test('buildRoleCatalog throws when a role name contains a comma', () => {
  const components = {
    auth: {
      '~k': 'auth-key',
      pages: { roles: { 'admin,auditor': ['reports'] } },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  expect(() => buildRoleCatalog({ components })).toThrow(
    'Auth role name "admin,auditor" contains a comma. Roles are stored as a comma-separated list on the membership record, so role names cannot contain commas.'
  );
});
