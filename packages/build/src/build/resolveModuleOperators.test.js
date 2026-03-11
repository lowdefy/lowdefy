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

import resolveModuleOperators, { scopeMenuItemIds } from './resolveModuleOperators.js';

const moduleEntry = {
  id: 'team-users',
  manifest: {
    pages: [{ id: 'users-list' }, { id: 'user-detail' }],
    connections: [{ id: 'users-db' }, { id: 'cache-db' }],
    api: [{ id: 'invite-user' }, { id: 'remove-user' }],
  },
  connections: {},
};

test('_module.pageId resolves to scoped page id', () => {
  const result = resolveModuleOperators({
    input: { pageId: { '_module.pageId': 'users-list' } },
    moduleEntry,
  });
  expect(result).toEqual({ pageId: 'team-users/users-list' });
});

test('_module.connectionId resolves to scoped connection id without remapping', () => {
  const result = resolveModuleOperators({
    input: { connectionId: { '_module.connectionId': 'users-db' } },
    moduleEntry,
  });
  expect(result).toEqual({ connectionId: 'team-users/users-db' });
});

test('_module.connectionId resolves to remapped connection id', () => {
  const result = resolveModuleOperators({
    input: { connectionId: { '_module.connectionId': 'users-db' } },
    moduleEntry: {
      ...moduleEntry,
      connections: { 'users-db': 'my-app-mongodb' },
    },
  });
  expect(result).toEqual({ connectionId: 'my-app-mongodb' });
});

test('_module.endpointId resolves to scoped endpoint id', () => {
  const result = resolveModuleOperators({
    input: { endpointId: { '_module.endpointId': 'invite-user' } },
    moduleEntry,
  });
  expect(result).toEqual({ endpointId: 'team-users/invite-user' });
});

test('_module.id resolves to module entry id', () => {
  const result = resolveModuleOperators({
    input: { id: { '_module.id': true } },
    moduleEntry,
  });
  expect(result).toEqual({ id: 'team-users' });
});

test('_module.pageId throws ConfigError for non-string value', () => {
  expect(() =>
    resolveModuleOperators({
      input: { pageId: { '_module.pageId': 123 } },
      moduleEntry,
    })
  ).toThrow('_module.pageId requires a string page name.');
});

test('_module.pageId throws ConfigError for page not in manifest', () => {
  expect(() =>
    resolveModuleOperators({
      input: { pageId: { '_module.pageId': 'nonexistent' } },
      moduleEntry,
    })
  ).toThrow('Module "team-users" does not export page "nonexistent".');
});

test('_module.connectionId throws ConfigError for non-string value', () => {
  expect(() =>
    resolveModuleOperators({
      input: { connectionId: { '_module.connectionId': true } },
      moduleEntry,
    })
  ).toThrow('_module.connectionId requires a string connection name.');
});

test('_module.connectionId throws ConfigError for connection not in manifest', () => {
  expect(() =>
    resolveModuleOperators({
      input: { connectionId: { '_module.connectionId': 'nonexistent' } },
      moduleEntry,
    })
  ).toThrow('Module "team-users" does not export connection "nonexistent".');
});

test('_module.endpointId throws ConfigError for non-string value', () => {
  expect(() =>
    resolveModuleOperators({
      input: { endpointId: { '_module.endpointId': [] } },
      moduleEntry,
    })
  ).toThrow('_module.endpointId requires a string endpoint name.');
});

test('_module.endpointId throws ConfigError for endpoint not in manifest', () => {
  expect(() =>
    resolveModuleOperators({
      input: { endpointId: { '_module.endpointId': 'nonexistent' } },
      moduleEntry,
    })
  ).toThrow('Module "team-users" does not export endpoint "nonexistent".');
});

test('objects with multiple non-meta keys are returned unchanged', () => {
  const result = resolveModuleOperators({
    input: { obj: { '_module.pageId': 'users-list', extra: 'value' } },
    moduleEntry,
  });
  expect(result).toEqual({ obj: { '_module.pageId': 'users-list', extra: 'value' } });
});

test('objects with meta keys and one operator key are resolved', () => {
  const result = resolveModuleOperators({
    input: { pageId: { '_module.pageId': 'users-list', '~k': 'some.key' } },
    moduleEntry,
  });
  expect(result).toEqual({ pageId: 'team-users/users-list' });
});

test('multiple operators in same tree are all resolved', () => {
  const result = resolveModuleOperators({
    input: {
      page: { '_module.pageId': 'users-list' },
      conn: { '_module.connectionId': 'users-db' },
      endpoint: { '_module.endpointId': 'invite-user' },
      mod: { '_module.id': true },
    },
    moduleEntry,
  });
  expect(result).toEqual({
    page: 'team-users/users-list',
    conn: 'team-users/users-db',
    endpoint: 'team-users/invite-user',
    mod: 'team-users',
  });
});

test('nested operators are resolved', () => {
  const result = resolveModuleOperators({
    input: {
      level1: {
        level2: {
          pageId: { '_module.pageId': 'user-detail' },
        },
      },
    },
    moduleEntry,
  });
  expect(result).toEqual({
    level1: {
      level2: {
        pageId: 'team-users/user-detail',
      },
    },
  });
});

test('_module.var is left unchanged', () => {
  const result = resolveModuleOperators({
    input: { val: { '_module.var': 'some-var' } },
    moduleEntry,
  });
  expect(result).toEqual({ val: { '_module.var': 'some-var' } });
});

test('input without operators is returned unchanged', () => {
  const input = { a: 1, b: 'hello', c: [1, 2, 3] };
  const result = resolveModuleOperators({ input, moduleEntry });
  expect(result).toEqual({ a: 1, b: 'hello', c: [1, 2, 3] });
});

test('_module.connectionId with no connections on moduleEntry defaults to empty remapping', () => {
  const result = resolveModuleOperators({
    input: { connectionId: { '_module.connectionId': 'users-db' } },
    moduleEntry: {
      id: 'team-users',
      manifest: {
        connections: [{ id: 'users-db' }],
      },
    },
  });
  expect(result).toEqual({ connectionId: 'team-users/users-db' });
});

describe('scopeMenuItemIds', () => {
  test('prefixes all id fields in a flat links array', () => {
    const links = [{ id: 'home' }, { id: 'about' }];
    scopeMenuItemIds(links, 'team-users');
    expect(links).toEqual([{ id: 'team-users/home' }, { id: 'team-users/about' }]);
  });

  test('prefixes ids in nested links', () => {
    const links = [
      {
        id: 'group',
        links: [{ id: 'item1' }, { id: 'item2', links: [{ id: 'nested' }] }],
      },
    ];
    scopeMenuItemIds(links, 'mod');
    expect(links).toEqual([
      {
        id: 'mod/group',
        links: [{ id: 'mod/item1' }, { id: 'mod/item2', links: [{ id: 'mod/nested' }] }],
      },
    ]);
  });

  test('handles non-array input gracefully', () => {
    expect(() => scopeMenuItemIds(null, 'mod')).not.toThrow();
    expect(() => scopeMenuItemIds(undefined, 'mod')).not.toThrow();
  });

  test('handles items without id', () => {
    const links = [{ title: 'no-id' }, { id: 'has-id' }];
    scopeMenuItemIds(links, 'mod');
    expect(links).toEqual([{ title: 'no-id' }, { id: 'mod/has-id' }]);
  });
});
