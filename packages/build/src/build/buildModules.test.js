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

import buildModules from './buildModules.js';

function makeModuleEntry({ id, manifest, connections }) {
  return {
    id,
    source: `github:test/${id}@v1`,
    vars: {},
    connections: connections ?? {},
    manifest: manifest ?? {},
  };
}

function makeContext(modules) {
  const ctx = { modules: {} };
  for (const mod of modules) {
    ctx.modules[mod.id] = mod;
  }
  return ctx;
}

test('buildModules adds module pages with scoped IDs', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {
      pages: [
        { id: 'users-list', type: 'PageHeaderMenu', blocks: [] },
        { id: 'user-detail', type: 'PageHeaderMenu', blocks: [] },
      ],
    },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
    pages: [{ id: 'home', type: 'PageHeaderMenu' }],
  };

  const result = buildModules({ components, context });

  expect(result.pages).toEqual([
    { id: 'home', type: 'PageHeaderMenu' },
    { id: 'team-users/users-list', type: 'PageHeaderMenu', blocks: [] },
    { id: 'team-users/user-detail', type: 'PageHeaderMenu', blocks: [] },
  ]);
});

test('buildModules adds module connections with scoped IDs', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {
      connections: [
        { id: 'users-db', type: 'MongoDBCollection', properties: {} },
      ],
    },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
    connections: [{ id: 'app-db', type: 'MongoDBCollection' }],
  };

  const result = buildModules({ components, context });

  expect(result.connections).toEqual([
    { id: 'app-db', type: 'MongoDBCollection' },
    { id: 'team-users/users-db', type: 'MongoDBCollection', properties: {} },
  ]);
});

test('buildModules adds module API endpoints with scoped IDs', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {
      api: [{ id: 'invite-user', type: 'MongoDBInsertOne' }],
    },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
  };

  const result = buildModules({ components, context });

  expect(result.api).toEqual([{ id: 'team-users/invite-user', type: 'MongoDBInsertOne' }]);
});

test('buildModules skips remapped connections', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {
      connections: [
        { id: 'users-db', type: 'MongoDBCollection' },
        { id: 'cache-db', type: 'MongoDBCollection' },
      ],
    },
    connections: { 'users-db': 'my-app-mongodb' },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
  };

  const result = buildModules({ components, context });

  // Only cache-db should be added; users-db is remapped
  expect(result.connections).toEqual([
    { id: 'team-users/cache-db', type: 'MongoDBCollection' },
  ]);
});

test('buildModules resolves _module.pageId operators in pages', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {
      pages: [
        {
          id: 'users-list',
          type: 'PageHeaderMenu',
          blocks: [
            {
              id: 'link',
              type: 'Button',
              events: {
                onClick: [
                  {
                    id: 'go',
                    type: 'Link',
                    params: { pageId: { '_module.pageId': 'user-detail' } },
                  },
                ],
              },
            },
          ],
        },
        { id: 'user-detail', type: 'PageHeaderMenu', blocks: [] },
      ],
    },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
  };

  const result = buildModules({ components, context });

  expect(result.pages[0].blocks[0].events.onClick[0].params.pageId).toBe(
    'team-users/user-detail'
  );
});

test('buildModules resolves _module.connectionId with remapping in connections', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {
      pages: [
        {
          id: 'users-list',
          type: 'PageHeaderMenu',
          requests: [
            {
              id: 'get-users',
              type: 'MongoDBFind',
              connectionId: { '_module.connectionId': 'users-db' },
            },
          ],
        },
      ],
      connections: [{ id: 'users-db', type: 'MongoDBCollection' }],
    },
    connections: { 'users-db': 'my-app-mongodb' },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
  };

  const result = buildModules({ components, context });

  expect(result.pages[0].requests[0].connectionId).toBe('my-app-mongodb');
});

test('buildModules removes components.modules after processing', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {},
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
    pages: [],
  };

  const result = buildModules({ components, context });

  expect(result.modules).toBeUndefined();
});

test('buildModules handles no modules array', () => {
  const context = makeContext([]);
  const components = { pages: [{ id: 'home' }] };

  const result = buildModules({ components, context });

  expect(result.pages).toEqual([{ id: 'home' }]);
  expect(result.modules).toBeUndefined();
});

test('buildModules handles empty modules array', () => {
  const context = makeContext([]);
  const components = { modules: [], pages: [{ id: 'home' }] };

  const result = buildModules({ components, context });

  expect(result.pages).toEqual([{ id: 'home' }]);
});

test('buildModules throws ConfigError when module entry not registered', () => {
  const context = makeContext([]);
  const components = {
    modules: [{ id: 'nonexistent' }],
  };

  expect(() => buildModules({ components, context })).toThrow(
    'Module entry "nonexistent" not registered. Check that buildModuleDefs ran successfully.'
  );
});

test('buildModules throws ConfigError for invalid connection remapping key', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {
      connections: [{ id: 'users-db', type: 'MongoDBCollection' }],
    },
    connections: { 'nonexistent-db': 'my-app-mongodb' },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
  };

  expect(() => buildModules({ components, context })).toThrow(
    'Module "team-users" connection remapping references "nonexistent-db", ' +
      'but the module does not export a connection with that id.'
  );
});

test('buildModules processes multiple module entries without ID collisions', () => {
  const teamUsers = makeModuleEntry({
    id: 'team-users',
    manifest: {
      pages: [{ id: 'users-list', type: 'PageHeaderMenu' }],
      connections: [{ id: 'users-db', type: 'MongoDBCollection' }],
    },
  });
  const clientUsers = makeModuleEntry({
    id: 'client-users',
    manifest: {
      pages: [{ id: 'users-list', type: 'PageHeaderMenu' }],
      connections: [{ id: 'users-db', type: 'MongoDBCollection' }],
    },
  });
  const context = makeContext([teamUsers, clientUsers]);
  const components = {
    modules: [{ id: 'team-users' }, { id: 'client-users' }],
  };

  const result = buildModules({ components, context });

  expect(result.pages).toEqual([
    { id: 'team-users/users-list', type: 'PageHeaderMenu' },
    { id: 'client-users/users-list', type: 'PageHeaderMenu' },
  ]);
  expect(result.connections).toEqual([
    { id: 'team-users/users-db', type: 'MongoDBCollection' },
    { id: 'client-users/users-db', type: 'MongoDBCollection' },
  ]);
});

test('buildModules processes same module package with different entry IDs', () => {
  const manifest = {
    pages: [{ id: 'users-list', type: 'PageHeaderMenu' }],
    connections: [{ id: 'users-db', type: 'MongoDBCollection' }],
    api: [{ id: 'invite-user', type: 'MongoDBInsertOne' }],
  };
  const entry1 = makeModuleEntry({ id: 'team-users', manifest });
  const entry2 = makeModuleEntry({ id: 'client-users', manifest });
  const context = makeContext([entry1, entry2]);
  const components = {
    modules: [{ id: 'team-users' }, { id: 'client-users' }],
  };

  const result = buildModules({ components, context });

  expect(result.pages.map((p) => p.id)).toEqual([
    'team-users/users-list',
    'client-users/users-list',
  ]);
  expect(result.connections.map((c) => c.id)).toEqual([
    'team-users/users-db',
    'client-users/users-db',
  ]);
  expect(result.api.map((e) => e.id)).toEqual([
    'team-users/invite-user',
    'client-users/invite-user',
  ]);
});

test('buildModules initializes pages array when components.pages is undefined', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {
      pages: [{ id: 'users-list', type: 'PageHeaderMenu' }],
    },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
  };

  const result = buildModules({ components, context });

  expect(result.pages).toEqual([{ id: 'team-users/users-list', type: 'PageHeaderMenu' }]);
});

test('buildModules resolves _module.endpointId in API endpoints', () => {
  const moduleEntry = makeModuleEntry({
    id: 'notifications',
    manifest: {
      api: [
        {
          id: 'send-notification',
          type: 'Custom',
          properties: {
            callbackEndpoint: { '_module.endpointId': 'send-notification' },
          },
        },
      ],
    },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'notifications' }],
  };

  const result = buildModules({ components, context });

  expect(result.api[0].id).toBe('notifications/send-notification');
  expect(result.api[0].properties.callbackEndpoint).toBe('notifications/send-notification');
});

test('buildModules resolves _module.id in page content', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {
      pages: [
        {
          id: 'users-list',
          type: 'PageHeaderMenu',
          properties: {
            title: { '_module.id': true },
          },
        },
      ],
    },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
  };

  const result = buildModules({ components, context });

  expect(result.pages[0].properties.title).toBe('team-users');
});

test('buildModules processes modules in order they appear', () => {
  const alpha = makeModuleEntry({
    id: 'alpha',
    manifest: { pages: [{ id: 'page-a', type: 'Page' }] },
  });
  const beta = makeModuleEntry({
    id: 'beta',
    manifest: { pages: [{ id: 'page-b', type: 'Page' }] },
  });
  const context = makeContext([alpha, beta]);
  const components = {
    modules: [{ id: 'alpha' }, { id: 'beta' }],
    pages: [{ id: 'home', type: 'Page' }],
  };

  const result = buildModules({ components, context });

  expect(result.pages.map((p) => p.id)).toEqual([
    'home',
    'alpha/page-a',
    'beta/page-b',
  ]);
});

// Secret whitelist validation tests

test('buildModules passes when _secret references a declared secret', () => {
  const moduleEntry = makeModuleEntry({
    id: 'notifications',
    manifest: {
      secrets: [{ name: 'SENDGRID_API_KEY', description: 'SendGrid key' }],
      connections: [
        {
          id: 'sendgrid',
          type: 'AxiosHttp',
          properties: { apiKey: { _secret: 'SENDGRID_API_KEY' } },
        },
      ],
    },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'notifications' }],
  };

  const result = buildModules({ components, context });

  expect(result.connections).toHaveLength(1);
  expect(result.connections[0].id).toBe('notifications/sendgrid');
});

test('buildModules throws ConfigError when _secret references undeclared secret in page', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {
      secrets: [{ name: 'MONGODB', description: 'Mongo URI' }],
      pages: [
        {
          id: 'users-list',
          type: 'PageHeaderMenu',
          blocks: [
            {
              id: 'info',
              type: 'Paragraph',
              properties: { content: { _secret: 'DATABASE_URL' } },
            },
          ],
        },
      ],
    },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
  };

  expect(() => buildModules({ components, context })).toThrow(
    'Module "team-users" references secret "DATABASE_URL" but does not declare it in module.lowdefy.yaml secrets.'
  );
});

test('buildModules throws ConfigError when _secret references undeclared secret in connection', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {
      connections: [
        {
          id: 'users-db',
          type: 'MongoDBCollection',
          properties: { uri: { _secret: 'MONGODB' } },
        },
      ],
    },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
  };

  expect(() => buildModules({ components, context })).toThrow(
    'Module "team-users" references secret "MONGODB" but does not declare it in module.lowdefy.yaml secrets.'
  );
});

test('buildModules throws ConfigError when _secret references undeclared secret in API endpoint', () => {
  const moduleEntry = makeModuleEntry({
    id: 'notifications',
    manifest: {
      api: [
        {
          id: 'send-email',
          type: 'Custom',
          properties: { apiKey: { _secret: 'SENDGRID_KEY' } },
        },
      ],
    },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'notifications' }],
  };

  expect(() => buildModules({ components, context })).toThrow(
    'Module "notifications" references secret "SENDGRID_KEY" but does not declare it in module.lowdefy.yaml secrets.'
  );
});

test('buildModules skips secret validation for remapped connections', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {
      connections: [
        {
          id: 'users-db',
          type: 'MongoDBCollection',
          properties: { uri: { _secret: 'UNDECLARED_SECRET' } },
        },
      ],
    },
    connections: { 'users-db': 'my-app-mongodb' },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
  };

  // Should not throw because users-db is remapped
  const result = buildModules({ components, context });

  expect(result.connections).toBeUndefined();
});

test('buildModules rejects all _secret references when module has no secrets declaration', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {
      pages: [
        {
          id: 'users-list',
          type: 'PageHeaderMenu',
          properties: { apiKey: { _secret: 'ANY_SECRET' } },
        },
      ],
    },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
  };

  expect(() => buildModules({ components, context })).toThrow(
    'Module "team-users" references secret "ANY_SECRET" but does not declare it in module.lowdefy.yaml secrets.'
  );
});

test('buildModules validates deeply nested _secret references', () => {
  const moduleEntry = makeModuleEntry({
    id: 'team-users',
    manifest: {
      secrets: [{ name: 'ALLOWED' }],
      pages: [
        {
          id: 'page',
          type: 'Page',
          blocks: [
            {
              id: 'block',
              type: 'Box',
              areas: {
                content: {
                  blocks: [
                    {
                      id: 'inner',
                      type: 'Text',
                      properties: { value: { _secret: 'NOT_ALLOWED' } },
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'team-users' }],
  };

  expect(() => buildModules({ components, context })).toThrow(
    'Module "team-users" references secret "NOT_ALLOWED"'
  );
});

test('buildModules allows multiple declared secrets', () => {
  const moduleEntry = makeModuleEntry({
    id: 'notifications',
    manifest: {
      secrets: [
        { name: 'MONGODB', description: 'Mongo URI' },
        { name: 'SENDGRID_API_KEY', description: 'SendGrid key', required: false },
      ],
      connections: [
        {
          id: 'db',
          type: 'MongoDBCollection',
          properties: { uri: { _secret: 'MONGODB' } },
        },
        {
          id: 'sendgrid',
          type: 'AxiosHttp',
          properties: { apiKey: { _secret: 'SENDGRID_API_KEY' } },
        },
      ],
    },
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'notifications' }],
  };

  const result = buildModules({ components, context });

  expect(result.connections).toHaveLength(2);
});

test('buildModules handles module with no pages, connections, or api', () => {
  const moduleEntry = makeModuleEntry({
    id: 'empty-module',
    manifest: {},
  });
  const context = makeContext([moduleEntry]);
  const components = {
    modules: [{ id: 'empty-module' }],
    pages: [{ id: 'home' }],
  };

  const result = buildModules({ components, context });

  expect(result.pages).toEqual([{ id: 'home' }]);
  expect(result.connections).toBeUndefined();
  expect(result.api).toBeUndefined();
});
