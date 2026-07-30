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

test('buildRoleCatalog normalizes an empty catalog to an empty array', () => {
  const components = {
    auth: {
      roles: [],
      pages: { roles: {} },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  const res = buildRoleCatalog({ components });
  expect(res.auth.roles).toEqual([]);
});

test('buildRoleCatalog treats an absent catalog as empty', () => {
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

test('buildRoleCatalog defaults label to id and passes description through', () => {
  const components = {
    auth: {
      roles: [
        { id: 'admin', label: 'Administrator', description: 'Full access' },
        { id: 'auditor' },
      ],
      pages: { roles: {} },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  const res = buildRoleCatalog({ components });
  expect(res.auth.roles).toEqual([
    { id: 'admin', label: 'Administrator', description: 'Full access' },
    { id: 'auditor', label: 'auditor', description: undefined },
  ]);
});

test('buildRoleCatalog does not auto-inject gate role names into the catalog', () => {
  const components = {
    auth: {
      roles: [{ id: 'admin' }, { id: 'auditor' }],
      pages: { roles: { admin: ['admin-*'], auditor: ['reports'] } },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  const res = buildRoleCatalog({ components });
  expect(res.auth.roles).toEqual([
    { id: 'admin', label: 'admin', description: undefined },
    { id: 'auditor', label: 'auditor', description: undefined },
  ]);
});

test('buildRoleCatalog passes when every gate reference is declared under pinned', () => {
  const components = {
    auth: {
      roles: [{ id: 'admin' }, { id: 'auditor' }, { id: 'branch-manager' }, { id: 'operator' }],
      pages: { roles: { admin: ['admin-*'], auditor: ['reports'] } },
      api: { roles: { admin: ['admin-api'], 'branch-manager': ['branches'] } },
      websockets: { roles: { operator: ['live-feed'] } },
    },
  };
  expect(() => buildRoleCatalog({ components })).not.toThrow();
});

test('buildRoleCatalog throws when a gate references an undeclared role under pinned', () => {
  const components = {
    auth: {
      '~k': 'auth-key',
      roles: [{ id: 'admin' }],
      pages: { roles: { auditor: ['reports'] } },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  expect(() => buildRoleCatalog({ components })).toThrow(
    'Auth gate references role "auditor", which is not declared in auth.roles.'
  );
});

test('buildRoleCatalog throws when a gate references an undeclared role under pinned by default', () => {
  const components = {
    auth: {
      '~k': 'auth-key',
      roles: [{ id: 'admin' }],
      organizations: {},
      pages: { roles: {} },
      api: { roles: { auditor: ['reports'] } },
      websockets: { roles: {} },
    },
  };
  expect(() => buildRoleCatalog({ components })).toThrow(
    'Auth gate references role "auditor", which is not declared in auth.roles.'
  );
});

test('buildRoleCatalog accepts built-in tier names as gate references under tenant', () => {
  const components = {
    auth: {
      roles: [{ id: 'branch-manager' }],
      organizations: { policy: 'tenant' },
      pages: { roles: { owner: ['org-settings'], admin: ['admin-*'], member: ['dashboard'] } },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  expect(() => buildRoleCatalog({ components })).not.toThrow();
});

test('buildRoleCatalog throws for an undeclared custom gate reference under tenant', () => {
  const components = {
    auth: {
      '~k': 'auth-key',
      roles: [{ id: 'admin' }],
      organizations: { policy: 'tenant' },
      pages: { roles: { auditor: ['reports'] } },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  expect(() => buildRoleCatalog({ components })).toThrow(
    'Auth gate references role "auditor", which is not declared in auth.roles.'
  );
});

test('buildRoleCatalog throws when an authored id contains a comma', () => {
  const components = {
    auth: {
      '~k': 'auth-key',
      roles: [{ id: 'admin,auditor' }],
      pages: { roles: {} },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  expect(() => buildRoleCatalog({ components })).toThrow(
    'Auth role name "admin,auditor" contains a comma. Roles are stored as a comma-separated list on the membership record, so role names cannot contain commas.'
  );
});

test('buildRoleCatalog throws when an authored id begins with "$"', () => {
  const components = {
    auth: {
      '~k': 'auth-key',
      roles: [{ id: '$lowdefy-system' }],
      pages: { roles: {} },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  expect(() => buildRoleCatalog({ components })).toThrow(
    'Auth role id "$lowdefy-system" is reserved — role ids may not begin with "$".'
  );
});

test('buildRoleCatalog throws a located error when an authored id is a reserved name', () => {
  const components = {
    auth: {
      '~k': 'auth-key',
      roles: [{ id: '__proto__', '~k': 'role-key' }],
      pages: { roles: {} },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  expect(() => buildRoleCatalog({ components })).toThrow(
    'Auth role id "__proto__" is a reserved name and cannot be used as a role id.'
  );
  try {
    buildRoleCatalog({ components });
  } catch (e) {
    expect(e.configKey).toBe('role-key');
  }
});

test('buildRoleCatalog rejects a gate reference to a reserved role name as undeclared', () => {
  // The catalog check above forbids declaring a reserved role id, so a gate
  // naming one can never resolve - it fails as an undeclared reference.
  const components = {
    auth: {
      '~k': 'auth-key',
      roles: [{ id: 'admin' }],
      pages: { roles: { constructor: ['reports'] } },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  expect(() => buildRoleCatalog({ components })).toThrow(
    'Auth gate references role "constructor", which is not declared in auth.roles.'
  );
});

test('buildRoleCatalog throws when an authored id is declared more than once', () => {
  const components = {
    auth: {
      '~k': 'auth-key',
      roles: [{ id: 'admin' }, { id: 'admin', label: 'Duplicate' }],
      pages: { roles: {} },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  expect(() => buildRoleCatalog({ components })).toThrow(
    'Auth role id "admin" is declared more than once.'
  );
});

test('buildRoleCatalog passes when the userAdminRole is declared in the catalog', () => {
  const components = {
    auth: {
      roles: [{ id: 'user-admin' }],
      userAdminRole: 'user-admin',
      pages: { roles: {} },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  expect(() => buildRoleCatalog({ components })).not.toThrow();
});

test('buildRoleCatalog throws when the userAdminRole is not declared in the catalog', () => {
  const components = {
    auth: {
      '~k': 'auth-key',
      roles: [{ id: 'admin' }],
      userAdminRole: 'user-admin',
      pages: { roles: {} },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  expect(() => buildRoleCatalog({ components })).toThrow(
    'Auth "userAdminRole" is "user-admin", which is not declared in auth.roles.'
  );
});

test('buildRoleCatalog uses the role entry config key when an authored id is invalid', () => {
  const components = {
    auth: {
      '~k': 'auth-key',
      roles: [{ id: '$reserved', '~k': 'role-key' }],
      pages: { roles: {} },
      api: { roles: {} },
      websockets: { roles: {} },
    },
  };
  try {
    buildRoleCatalog({ components });
    throw new Error('Expected buildRoleCatalog to throw.');
  } catch (error) {
    expect(error.configKey).toEqual('role-key');
  }
});
