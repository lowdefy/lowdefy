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

test('_module.pageId throws ConfigError for invalid value type', () => {
  expect(() =>
    resolveModuleOperators({
      input: { pageId: { '_module.pageId': 123 } },
      moduleEntry,
    })
  ).toThrow('_module.pageId requires a string or object { id, module }.');
});

test('_module.pageId throws ConfigError for page not in manifest', () => {
  expect(() =>
    resolveModuleOperators({
      input: { pageId: { '_module.pageId': 'nonexistent' } },
      moduleEntry,
    })
  ).toThrow('Module "team-users" does not export page "nonexistent".');
});

test('_module.connectionId throws ConfigError for invalid value type', () => {
  expect(() =>
    resolveModuleOperators({
      input: { connectionId: { '_module.connectionId': true } },
      moduleEntry,
    })
  ).toThrow('_module.connectionId requires a string or object { id, module }.');
});

test('_module.connectionId throws ConfigError for connection not in manifest', () => {
  expect(() =>
    resolveModuleOperators({
      input: { connectionId: { '_module.connectionId': 'nonexistent' } },
      moduleEntry,
    })
  ).toThrow('Module "team-users" does not export connection "nonexistent".');
});

test('_module.endpointId throws ConfigError for invalid value type', () => {
  expect(() =>
    resolveModuleOperators({
      input: { endpointId: { '_module.endpointId': [] } },
      moduleEntry,
    })
  ).toThrow('_module.endpointId requires a string or object { id, module }.');
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

// Cross-module (object form) tests

const context = {
  modules: {
    'my-contacts': {
      id: 'my-contacts',
      exports: {
        pages: [{ id: 'contact-detail' }, { id: 'contact-list' }],
        connections: [{ id: 'contacts-db' }],
        api: [{ id: 'save-contact' }],
      },
      connections: {},
    },
    'remapped-contacts': {
      id: 'remapped-contacts',
      exports: {
        connections: [{ id: 'contacts-db' }],
      },
      connections: { 'contacts-db': 'shared-mongodb' },
    },
  },
};

const crossModuleEntry = {
  ...moduleEntry,
  moduleDependencies: {
    contacts: 'my-contacts',
    'remapped-contacts': 'remapped-contacts',
  },
};

describe('cross-module _module.pageId object form', () => {
  test('resolves to target entry scoped page id', () => {
    const result = resolveModuleOperators({
      input: { pageId: { '_module.pageId': { id: 'contact-detail', module: 'contacts' } } },
      moduleEntry: crossModuleEntry,
      context,
    });
    expect(result).toEqual({ pageId: 'my-contacts/contact-detail' });
  });

  test('throws when dependency name not in wiring', () => {
    expect(() =>
      resolveModuleOperators({
        input: { pageId: { '_module.pageId': { id: 'contact-detail', module: 'unknown' } } },
        moduleEntry: crossModuleEntry,
        context,
      })
    ).toThrow(
      'Module "team-users" references dependency "unknown" ' +
        'but no mapping exists. Add dependencies.unknown to the entry.'
    );
  });

  test('throws when target entry does not exist in context.modules', () => {
    expect(() =>
      resolveModuleOperators({
        input: { pageId: { '_module.pageId': { id: 'x', module: 'contacts' } } },
        moduleEntry: {
          ...crossModuleEntry,
          moduleDependencies: { contacts: 'nonexistent-entry' },
        },
        context,
      })
    ).toThrow(
      'Module "team-users" dependency "contacts" maps to ' +
        '"nonexistent-entry" but no module entry "nonexistent-entry" exists.'
    );
  });

  test('throws when page not in target exports', () => {
    expect(() =>
      resolveModuleOperators({
        input: { pageId: { '_module.pageId': { id: 'nonexistent', module: 'contacts' } } },
        moduleEntry: crossModuleEntry,
        context,
      })
    ).toThrow(
      'Module "team-users" references page "nonexistent" ' +
        'from dependency "contacts" (entry "my-contacts"), ' +
        'but that module does not export page "nonexistent".'
    );
  });
});

describe('cross-module _module.connectionId object form', () => {
  test('resolves to target entry scoped connection id without remapping', () => {
    const result = resolveModuleOperators({
      input: {
        connectionId: { '_module.connectionId': { id: 'contacts-db', module: 'contacts' } },
      },
      moduleEntry: crossModuleEntry,
      context,
    });
    expect(result).toEqual({ connectionId: 'my-contacts/contacts-db' });
  });

  test('resolves to remapped value when target has connection remapping', () => {
    const result = resolveModuleOperators({
      input: {
        connectionId: {
          '_module.connectionId': { id: 'contacts-db', module: 'remapped-contacts' },
        },
      },
      moduleEntry: crossModuleEntry,
      context,
    });
    expect(result).toEqual({ connectionId: 'shared-mongodb' });
  });

  test('throws when connection not in target exports', () => {
    expect(() =>
      resolveModuleOperators({
        input: {
          connectionId: { '_module.connectionId': { id: 'nonexistent', module: 'contacts' } },
        },
        moduleEntry: crossModuleEntry,
        context,
      })
    ).toThrow(
      'Module "team-users" references connection "nonexistent" ' +
        'from dependency "contacts" (entry "my-contacts"), ' +
        'but that module does not export connection "nonexistent".'
    );
  });
});

describe('cross-module _module.endpointId object form', () => {
  test('resolves to target entry scoped endpoint id', () => {
    const result = resolveModuleOperators({
      input: {
        endpointId: { '_module.endpointId': { id: 'save-contact', module: 'contacts' } },
      },
      moduleEntry: crossModuleEntry,
      context,
    });
    expect(result).toEqual({ endpointId: 'my-contacts/save-contact' });
  });

  test('throws when endpoint not in target exports', () => {
    expect(() =>
      resolveModuleOperators({
        input: {
          endpointId: { '_module.endpointId': { id: 'nonexistent', module: 'contacts' } },
        },
        moduleEntry: crossModuleEntry,
        context,
      })
    ).toThrow(
      'Module "team-users" references endpoint "nonexistent" ' +
        'from dependency "contacts" (entry "my-contacts"), ' +
        'but that module does not export endpoint "nonexistent".'
    );
  });
});

describe('cross-module _module.id object form', () => {
  test('returns target entry id', () => {
    const result = resolveModuleOperators({
      input: { id: { '_module.id': { module: 'contacts' } } },
      moduleEntry: crossModuleEntry,
      context,
    });
    expect(result).toEqual({ id: 'my-contacts' });
  });

  test('non-object value still returns own module id', () => {
    const result = resolveModuleOperators({
      input: { id: { '_module.id': true } },
      moduleEntry: crossModuleEntry,
      context,
    });
    expect(result).toEqual({ id: 'team-users' });
  });

  test('throws for object without module string', () => {
    expect(() =>
      resolveModuleOperators({
        input: { id: { '_module.id': { notModule: true } } },
        moduleEntry: crossModuleEntry,
        context,
      })
    ).toThrow('_module.id requires a truthy value or object { module }.');
  });
});

describe('cross-module operators with missing exports defaults', () => {
  test('handles target with no exports field', () => {
    const ctxNoExports = {
      modules: {
        'bare-module': { id: 'bare-module', connections: {} },
      },
    };
    const entry = {
      ...moduleEntry,
      moduleDependencies: { bare: 'bare-module' },
    };
    // _module.id object form works without exports
    const result = resolveModuleOperators({
      input: { id: { '_module.id': { module: 'bare' } } },
      moduleEntry: entry,
      context: ctxNoExports,
    });
    expect(result).toEqual({ id: 'bare-module' });
  });
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
