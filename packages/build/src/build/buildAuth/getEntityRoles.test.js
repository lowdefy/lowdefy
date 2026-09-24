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

import buildAuth from './buildAuth.js';
import getEntityRoles from './getEntityRoles.js';
import testContext from '../../test-utils/testContext.js';

test('No roles', () => {
  const components = {
    auth: {
      pages: {
        roles: {},
      },
    },
  };
  const res = getEntityRoles({ components, entity: 'pages' });
  expect(res).toEqual({});
});

test('Roles, 1 page per role', () => {
  const components = {
    auth: {
      pages: {
        roles: {
          role1: ['page1'],
          role2: ['page2'],
        },
      },
    },
    pages: [{ id: 'page1' }, { id: 'page2' }],
  };
  const res = getEntityRoles({ components, entity: 'pages' });
  expect(res).toEqual({
    page1: ['role1'],
    page2: ['role2'],
  });
});

test('Multiple roles on a page', () => {
  const components = {
    auth: {
      pages: {
        roles: {
          role1: ['page1', 'page2'],
          role2: ['page2', 'page3'],
        },
      },
    },
    pages: [{ id: 'page1' }, { id: 'page2' }, { id: 'page3' }],
  };
  const res = getEntityRoles({ components, entity: 'pages' });
  expect(res).toEqual({
    page1: ['role1'],
    page2: ['role1', 'role2'],
    page3: ['role2'],
  });
});

test('Wildcard pattern matches multiple pages', () => {
  const components = {
    auth: {
      pages: {
        roles: {
          admin: ['team-users/*'],
        },
      },
    },
    pages: [
      { id: 'team-users/users-list' },
      { id: 'team-users/user-edit' },
      { id: 'home' },
    ],
  };
  const res = getEntityRoles({ components, entity: 'pages' });
  expect(res).toEqual({
    'team-users/users-list': ['admin'],
    'team-users/user-edit': ['admin'],
  });
});

test('Mixed exact and wildcard patterns in roles', () => {
  const components = {
    auth: {
      pages: {
        roles: {
          admin: ['team-users/*', 'settings'],
          viewer: ['home'],
        },
      },
    },
    pages: [
      { id: 'team-users/users-list' },
      { id: 'settings' },
      { id: 'home' },
    ],
  };
  const res = getEntityRoles({ components, entity: 'pages' });
  expect(res).toEqual({
    'team-users/users-list': ['admin'],
    settings: ['admin'],
    home: ['viewer'],
  });
});

test('Wildcard * does not match across slashes', () => {
  const components = {
    auth: {
      pages: {
        roles: {
          admin: ['team-users/*'],
        },
      },
    },
    pages: [{ id: 'team-users/sub/deep' }, { id: 'team-users/list' }],
  };
  const res = getEntityRoles({ components, entity: 'pages' });
  expect(res).toEqual({
    'team-users/list': ['admin'],
  });
});

// Coverage regression: itemRoles here is keyed by item id, not by role name -
// role names only ever enter a Set. validateId does not save this function:
// buildAuth runs before buildApi, buildWebsockets and buildPages, so a reserved
// item id reaches getEntityRoles unvalidated and reads itemRoles[itemId] off
// Object.prototype. buildEntityAuth gates the ids first. Assert that through
// buildAuth, the step that actually precedes this function.
test('buildAuth rejects a reserved page id before getEntityRoles can key itemRoles', () => {
  const components = {
    auth: {
      secret: { _secret: 'BETTER_AUTH_SECRET' },
      database: { id: 'auth_db', type: 'MongoDBAuthAdapter', properties: {} },
      emailAndPassword: { enabled: true },
      roles: [{ id: 'admin' }],
      pages: {
        roles: {
          admin: ['*'],
        },
      },
    },
    pages: [{ id: '__proto__', '~k': 'page-key', type: 'Box' }],
  };
  expect(() => buildAuth({ components, context: testContext() })).toThrow(
    'Page id "__proto__" is a reserved name and cannot be used as an id.'
  );
});
