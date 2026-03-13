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

import getModuleRefContent from './getModuleRefContent.js';

function createContext({ modules } = {}) {
  return { modules: modules ?? {} };
}

function createModuleEntry({
  id = 'team-users',
  components = [],
  menus = [],
  pages = [],
  connections = [],
  api = [],
} = {}) {
  return {
    id,
    manifest: { components, menus, pages, connections, api },
    moduleDependencies: {},
  };
}

describe('getModuleRefContent', () => {
  test('returns component content and entryId from module manifest', async () => {
    const componentContent = { id: 'badge', type: 'Box', properties: { color: 'red' } };
    const context = createContext({
      modules: {
        notifications: createModuleEntry({
          id: 'notifications',
          components: [{ id: 'notification-badge', component: componentContent }],
        }),
      },
    });
    const result = await getModuleRefContent({
      context,
      refDef: { module: 'notifications', component: 'notification-badge' },
      referencedFrom: 'lowdefy.yaml',
    });
    expect(result).toEqual({ content: componentContent, entryId: 'notifications' });
  });

  test('returns menu links and entryId from module manifest', async () => {
    const links = [{ id: 'users', pageId: 'users-list' }];
    const context = createContext({
      modules: {
        'team-users': createModuleEntry({
          menus: [{ id: 'default', links }],
        }),
      },
    });
    const result = await getModuleRefContent({
      context,
      refDef: { module: 'team-users', menu: 'default' },
      referencedFrom: 'lowdefy.yaml',
    });
    expect(result).toEqual({ content: links, entryId: 'team-users' });
  });

  test('throws ConfigError for page ref (cross-module not supported)', async () => {
    const page = { id: 'users-list', type: 'PageSiderMenu', blocks: [] };
    const context = createContext({
      modules: {
        'team-users': createModuleEntry({
          pages: [page],
        }),
      },
    });
    await expect(
      getModuleRefContent({
        context,
        refDef: { module: 'team-users', page: 'users-list' },
        referencedFrom: 'lowdefy.yaml',
      })
    ).rejects.toThrow('Cross-module _ref does not support "page"');
  });

  test('throws ConfigError for connection ref (cross-module not supported)', async () => {
    const connection = { id: 'users-db', type: 'MongoDBCollection' };
    const context = createContext({
      modules: {
        'team-users': createModuleEntry({
          connections: [connection],
        }),
      },
    });
    await expect(
      getModuleRefContent({
        context,
        refDef: { module: 'team-users', connection: 'users-db' },
        referencedFrom: 'lowdefy.yaml',
      })
    ).rejects.toThrow('Cross-module _ref does not support "connection"');
  });

  test('throws ConfigError for api ref (cross-module not supported)', async () => {
    const endpoint = { id: 'get-users', type: 'MongoDBFind' };
    const context = createContext({
      modules: {
        'team-users': createModuleEntry({
          api: [endpoint],
        }),
      },
    });
    await expect(
      getModuleRefContent({
        context,
        refDef: { module: 'team-users', api: 'get-users' },
        referencedFrom: 'lowdefy.yaml',
      })
    ).rejects.toThrow('Cross-module _ref does not support "api"');
  });

  test('throws ConfigError when module entry is not found', async () => {
    const context = createContext({ modules: {} });
    await expect(
      getModuleRefContent({
        context,
        refDef: { module: 'nonexistent', component: 'badge' },
        referencedFrom: 'lowdefy.yaml',
      })
    ).rejects.toThrow('Module entry "nonexistent" not found.');
  });

  test('throws ConfigError when no export type property is provided', async () => {
    const context = createContext({
      modules: {
        'team-users': createModuleEntry(),
      },
    });
    await expect(
      getModuleRefContent({
        context,
        refDef: { module: 'team-users' },
        referencedFrom: 'lowdefy.yaml',
      })
    ).rejects.toThrow(
      'Module _ref requires "component" or "menu" property.'
    );
  });

  test('throws ConfigError when export is not found in manifest', async () => {
    const context = createContext({
      modules: {
        'team-users': createModuleEntry({
          components: [{ id: 'existing', component: { type: 'Box' } }],
        }),
      },
    });
    await expect(
      getModuleRefContent({
        context,
        refDef: { module: 'team-users', component: 'nonexistent' },
        referencedFrom: 'lowdefy.yaml',
      })
    ).rejects.toThrow('Module "team-users" does not export component "nonexistent".');
  });

  test('handles empty manifest arrays gracefully', async () => {
    const context = createContext({
      modules: {
        'team-users': createModuleEntry(),
      },
    });
    await expect(
      getModuleRefContent({
        context,
        refDef: { module: 'team-users', menu: 'default' },
        referencedFrom: 'lowdefy.yaml',
      })
    ).rejects.toThrow('Module "team-users" does not export menu "default".');
  });

  test('handles undefined manifest arrays with nullish coalescing', async () => {
    const context = createContext({
      modules: {
        'team-users': {
          id: 'team-users',
          manifest: {},
          moduleDependencies: {},
        },
      },
    });
    await expect(
      getModuleRefContent({
        context,
        refDef: { module: 'team-users', component: 'x' },
        referencedFrom: 'lowdefy.yaml',
      })
    ).rejects.toThrow('Module "team-users" does not export component "x".');
  });

  test('component export type takes priority over menu', async () => {
    const componentContent = { type: 'Box' };
    const context = createContext({
      modules: {
        mod: {
          id: 'mod',
          manifest: {
            components: [{ id: 'x', component: componentContent }],
            menus: [{ id: 'x', links: [] }],
          },
          moduleDependencies: {},
        },
      },
    });
    const result = await getModuleRefContent({
      context,
      refDef: { module: 'mod', component: 'x', menu: 'x' },
      referencedFrom: 'lowdefy.yaml',
    });
    expect(result).toEqual({ content: componentContent, entryId: 'mod' });
  });

  test('resolves abstract dependency name through walkCtx.moduleDependencies', async () => {
    const componentContent = { type: 'Box', properties: { title: 'Contact' } };
    const context = createContext({
      modules: {
        'crm-contacts': createModuleEntry({
          id: 'crm-contacts',
          components: [{ id: 'selector', component: componentContent }],
        }),
      },
    });
    const walkCtx = {
      moduleDependencies: { contacts: 'crm-contacts' },
    };
    const result = await getModuleRefContent({
      context,
      refDef: { module: 'contacts', component: 'selector' },
      referencedFrom: 'page.yaml',
      walkCtx,
    });
    expect(result).toEqual({ content: componentContent, entryId: 'crm-contacts' });
  });

  test('uses raw name as entry ID when no moduleDependencies in walkCtx', async () => {
    const componentContent = { type: 'Box' };
    const context = createContext({
      modules: {
        notifications: createModuleEntry({
          id: 'notifications',
          components: [{ id: 'badge', component: componentContent }],
        }),
      },
    });
    const result = await getModuleRefContent({
      context,
      refDef: { module: 'notifications', component: 'badge' },
      referencedFrom: 'lowdefy.yaml',
      walkCtx: null,
    });
    expect(result).toEqual({ content: componentContent, entryId: 'notifications' });
  });

  test('throws with wiring info when abstract name maps to nonexistent entry', async () => {
    const context = createContext({ modules: {} });
    const walkCtx = {
      moduleDependencies: { contacts: 'missing-entry' },
    };
    await expect(
      getModuleRefContent({
        context,
        refDef: { module: 'contacts', component: 'selector' },
        referencedFrom: 'page.yaml',
        walkCtx,
      })
    ).rejects.toThrow(
      'Module entry "contacts" not found. ("contacts" was mapped to "missing-entry" via dependency wiring.)'
    );
  });

  test('abstract name in wiring takes precedence over concrete entry with same name', async () => {
    const wrongContent = { type: 'Wrong' };
    const rightContent = { type: 'Right' };
    const context = createContext({
      modules: {
        contacts: createModuleEntry({
          id: 'contacts',
          components: [{ id: 'selector', component: wrongContent }],
        }),
        'contacts-other': createModuleEntry({
          id: 'contacts-other',
          components: [{ id: 'selector', component: rightContent }],
        }),
      },
    });
    const walkCtx = {
      moduleDependencies: { contacts: 'contacts-other' },
    };
    const result = await getModuleRefContent({
      context,
      refDef: { module: 'contacts', component: 'selector' },
      referencedFrom: 'page.yaml',
      walkCtx,
    });
    expect(result).toEqual({ content: rightContent, entryId: 'contacts-other' });
  });

  test('page ref error suggests _module.pageId operator', async () => {
    const context = createContext({
      modules: {
        'team-users': createModuleEntry({ pages: [{ id: 'list' }] }),
      },
    });
    await expect(
      getModuleRefContent({
        context,
        refDef: { module: 'team-users', page: 'list' },
        referencedFrom: 'lowdefy.yaml',
      })
    ).rejects.toThrow('Use _module.pageId');
  });

  test('connection ref error suggests _module.connectionId operator', async () => {
    const context = createContext({
      modules: {
        'team-users': createModuleEntry({ connections: [{ id: 'db' }] }),
      },
    });
    await expect(
      getModuleRefContent({
        context,
        refDef: { module: 'team-users', connection: 'db' },
        referencedFrom: 'lowdefy.yaml',
      })
    ).rejects.toThrow('Use _module.connectionId');
  });

  test('api ref error suggests _module.endpointId operator', async () => {
    const context = createContext({
      modules: {
        'team-users': createModuleEntry({ api: [{ id: 'ep' }] }),
      },
    });
    await expect(
      getModuleRefContent({
        context,
        refDef: { module: 'team-users', api: 'ep' },
        referencedFrom: 'lowdefy.yaml',
      })
    ).rejects.toThrow('Use _module.endpointId');
  });
});
