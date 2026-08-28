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

import getProtectedEntities, { getEntityDefaultProtected } from './getProtectedEntities.js';

test('No config', () => {
  const components = {
    auth: {
      pages: {},
    },
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual([]);
});

test('Public true', () => {
  const components = {
    auth: {
      pages: {
        public: true,
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual([]);
});

test('Protected empty array', () => {
  const components = {
    auth: {
      pages: {
        protected: [],
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual([]);
});

test('Protected empty array, public true', () => {
  const components = {
    auth: {
      pages: {
        protected: [],
        public: true,
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual([]);
});

test('Protected  true', () => {
  const components = {
    auth: {
      pages: {
        protected: true,
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual(['a', 'b', 'c']);
});

test('Public empty array', () => {
  const components = {
    auth: {
      pages: {
        public: [],
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual(['a', 'b', 'c']);
});

test('Protected true, public empty array', () => {
  const components = {
    auth: {
      pages: {
        protected: true,
        public: [],
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual(['a', 'b', 'c']);
});

test('Protected true, public array', () => {
  const components = {
    auth: {
      pages: {
        protected: true,
        public: ['a'],
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual(['b', 'c']);
});

test('Public array', () => {
  const components = {
    auth: {
      pages: {
        public: ['a'],
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual(['b', 'c']);
});

test('Protected array', () => {
  const components = {
    auth: {
      pages: {
        protected: ['a'],
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual(['a']);
});

test('Protected array, public true', () => {
  const components = {
    auth: {
      pages: {
        protected: ['a'],
        public: true,
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual(['a']);
});

test('Protected wildcard pattern expands to matching page IDs', () => {
  const components = {
    auth: {
      pages: {
        protected: ['team-users/*'],
      },
    },
    pages: [
      { id: 'team-users/users-list', type: 'Context' },
      { id: 'team-users/user-edit', type: 'Context' },
      { id: 'home', type: 'Context' },
    ],
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual(['team-users/users-list', 'team-users/user-edit']);
});

test('Public wildcard pattern excludes matching pages from protected', () => {
  const components = {
    auth: {
      pages: {
        public: ['team-users/*'],
      },
    },
    pages: [
      { id: 'team-users/users-list', type: 'Context' },
      { id: 'team-users/user-edit', type: 'Context' },
      { id: 'home', type: 'Context' },
    ],
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual(['home']);
});

test('Wildcard * does not match compound ids', () => {
  const components = {
    auth: {
      pages: {
        protected: ['*'],
      },
    },
    pages: [
      { id: 'home', type: 'Context' },
      { id: 'team-users/users-list', type: 'Context' },
    ],
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual(['home']);
});

test('Mixed exact and wildcard in protected array', () => {
  const components = {
    auth: {
      pages: {
        protected: ['home', 'team-users/*'],
      },
    },
    pages: [
      { id: 'home', type: 'Context' },
      { id: 'team-users/users-list', type: 'Context' },
      { id: 'login', type: 'Context' },
    ],
  };
  const res = getProtectedEntities({ components, entity: 'pages' });
  expect(res).toEqual(['home', 'team-users/users-list']);
});

test('getEntityDefaultProtected returns true when pages declare a public list', () => {
  const components = { auth: { pages: { public: ['home'] } } };
  expect(getEntityDefaultProtected({ components, entity: 'pages' })).toBe(true);
});

test('getEntityDefaultProtected returns true when pages protected is true', () => {
  const components = { auth: { pages: { protected: true } } };
  expect(getEntityDefaultProtected({ components, entity: 'pages' })).toBe(true);
});

test('getEntityDefaultProtected returns false when pages protected is a list', () => {
  const components = { auth: { pages: { protected: ['admin'] } } };
  expect(getEntityDefaultProtected({ components, entity: 'pages' })).toBe(false);
});

test('getEntityDefaultProtected returns false when pages declare no default', () => {
  const components = { auth: { pages: {} } };
  expect(getEntityDefaultProtected({ components, entity: 'pages' })).toBe(false);
});

test('getEntityDefaultProtected returns false when the app declares no auth.pages', () => {
  const components = { auth: {} };
  expect(getEntityDefaultProtected({ components, entity: 'pages' })).toBe(false);
});

test('getEntityDefaultProtected is entity-generic for api', () => {
  const components = { auth: { api: { protected: true } } };
  expect(getEntityDefaultProtected({ components, entity: 'api' })).toBe(true);
});
