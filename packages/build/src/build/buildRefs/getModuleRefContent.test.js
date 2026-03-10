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
  };
}

describe('getModuleRefContent', () => {
  test('returns component content from module manifest', async () => {
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
    expect(result).toEqual(componentContent);
  });

  test('returns menu links from module manifest', async () => {
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
    expect(result).toEqual(links);
  });

  test('returns page object from module manifest', async () => {
    const page = { id: 'users-list', type: 'PageSiderMenu', blocks: [] };
    const context = createContext({
      modules: {
        'team-users': createModuleEntry({
          pages: [page],
        }),
      },
    });
    const result = await getModuleRefContent({
      context,
      refDef: { module: 'team-users', page: 'users-list' },
      referencedFrom: 'lowdefy.yaml',
    });
    expect(result).toEqual(page);
  });

  test('returns connection object from module manifest', async () => {
    const connection = { id: 'users-db', type: 'MongoDBCollection' };
    const context = createContext({
      modules: {
        'team-users': createModuleEntry({
          connections: [connection],
        }),
      },
    });
    const result = await getModuleRefContent({
      context,
      refDef: { module: 'team-users', connection: 'users-db' },
      referencedFrom: 'lowdefy.yaml',
    });
    expect(result).toEqual(connection);
  });

  test('returns api endpoint object from module manifest', async () => {
    const endpoint = { id: 'get-users', type: 'MongoDBFind' };
    const context = createContext({
      modules: {
        'team-users': createModuleEntry({
          api: [endpoint],
        }),
      },
    });
    const result = await getModuleRefContent({
      context,
      refDef: { module: 'team-users', api: 'get-users' },
      referencedFrom: 'lowdefy.yaml',
    });
    expect(result).toEqual(endpoint);
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
      'Module _ref requires "component", "menu", "page", "connection", or "api" property.'
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

  test('throws ConfigError for missing page export', async () => {
    const context = createContext({
      modules: {
        'team-users': createModuleEntry({ pages: [] }),
      },
    });
    await expect(
      getModuleRefContent({
        context,
        refDef: { module: 'team-users', page: 'missing-page' },
        referencedFrom: 'lowdefy.yaml',
      })
    ).rejects.toThrow('Module "team-users" does not export page "missing-page".');
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
        },
      },
    });
    await expect(
      getModuleRefContent({
        context,
        refDef: { module: 'team-users', connection: 'db' },
        referencedFrom: 'lowdefy.yaml',
      })
    ).rejects.toThrow('Module "team-users" does not export connection "db".');
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
        },
      },
    });
    const result = await getModuleRefContent({
      context,
      refDef: { module: 'mod', component: 'x', menu: 'x' },
      referencedFrom: 'lowdefy.yaml',
    });
    expect(result).toEqual(componentContent);
  });
});
