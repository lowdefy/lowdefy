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

import fs from 'fs';
import os from 'os';
import path from 'path';

// Writes a throwaway server directory (build artifacts + a fake installed
// plugin in node_modules) for the docs service tests. Generated because a
// committed node_modules fixture would be gitignored.
function setupTestFixtures() {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-docs-test-'));
  const write = (relativePath, data) => {
    const filePath = path.join(fixtureDir, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, typeof data === 'string' ? data : JSON.stringify(data));
  };

  write('package.json', { name: 'test-fixture-server', version: '1.0.0', type: 'module' });

  // lib/build/config.js reads this at import time (screenshotPage → basePath).
  write('build/config.json', {});

  write('build/plugins/availableTypes.json', {
    actions: {
      SetState: {
        package: '@lowdefy/actions-core',
        originalTypeName: 'SetState',
        version: '5.0.0',
      },
    },
    agents: {},
    auth: { adapters: {}, callbacks: {}, events: {}, providers: {} },
    blocks: {
      Button: { package: '@lowdefy/blocks-antd', originalTypeName: 'Button', version: '5.0.0' },
      TestBlock: { package: 'test-plugin', originalTypeName: 'TestBlock', version: '1.0.0' },
    },
    connections: {
      AxiosHttp: {
        package: '@lowdefy/connection-axios-http',
        originalTypeName: 'AxiosHttp',
        version: '5.0.0',
      },
    },
    notifications: {},
    operators: {
      client: {
        _get: { package: '@lowdefy/operators-js', originalTypeName: '_get', version: '5.0.0' },
      },
      server: {
        _get: { package: '@lowdefy/operators-js', originalTypeName: '_get', version: '5.0.0' },
        _secret: {
          package: '@lowdefy/operators-js',
          originalTypeName: '_secret',
          version: '5.0.0',
        },
      },
    },
    requests: {
      AxiosHttp: {
        package: '@lowdefy/connection-axios-http',
        originalTypeName: 'AxiosHttp',
        version: '5.0.0',
      },
    },
    websockets: {},
  });

  write('build/types.json', {
    actions: {},
    agents: {},
    auth: { adapters: {}, callbacks: {}, events: {}, providers: {} },
    blocks: {
      Button: {
        package: '@lowdefy/blocks-antd',
        originalTypeName: 'Button',
        version: '5.0.0',
        count: 3,
      },
    },
    connections: {},
    notifications: {},
    operators: {
      client: {
        _get: {
          package: '@lowdefy/operators-js',
          originalTypeName: '_get',
          version: '5.0.0',
          count: 1,
        },
      },
      server: {},
    },
    requests: {},
    websockets: {},
  });

  write('build/plugins/blockSchemas.json', {
    Button: { type: 'object', properties: { title: { type: 'string' } } },
    TestBlock: { type: 'object', properties: {} },
  });
  write('build/plugins/blockMetas.json', {
    Button: { category: 'display', hazards: [] },
    TestBlock: {
      category: 'input',
      valueType: 'string',
      hazards: [
        { id: 'test-block-hazard', message: 'TestBlock does something surprising.', see: null },
        // Same id as a framework hazard — getHazards must de-duplicate, keeping
        // the plugin's own wording.
        {
          id: 'visible-false-prunes-state',
          message: 'Plugin wording for visible: false.',
          see: null,
        },
      ],
    },
  });
  write('build/plugins/actionSchemas.json', { SetState: { type: 'object' } });
  write('build/plugins/operatorSchemas.json', { _get: { params: { type: 'object' } } });
  write('build/plugins/operatorMetas.json', {
    _get: {
      hazards: [
        { id: 'get-fixture-hazard', message: '_get fixture hazard.', see: 'operators/_get' },
      ],
    },
  });
  write('build/plugins/connectionSchemas.json', {
    AxiosHttp: { schema: { type: 'object' }, requests: ['AxiosHttp'] },
  });
  write('build/plugins/requestSchemas.json', {
    AxiosHttp: { schema: { type: 'object' }, meta: { checkRead: false, checkWrite: false } },
    ReadOnlyRequest: { schema: { type: 'object' }, meta: { checkRead: true, checkWrite: false } },
    WriteRequest: {
      schema: { type: 'object' },
      meta: {
        checkRead: true,
        checkWrite: true,
        hazards: [{ id: 'write-request-hazard', message: 'Writes are final.', see: null }],
      },
    },
    // No "meta" at all — some custom plugins don't declare it; treated as unknown.
    UnknownMetaRequest: { schema: { type: 'object' } },
  });
  write('build/customTypesMap.json', {
    blocks: {
      TestBlock: { package: 'test-plugin', originalTypeName: 'TestBlock', version: '1.0.0' },
    },
  });
  write('build/installedPluginPackages.json', [
    '@lowdefy/blocks-antd',
    '@lowdefy/actions-core',
    '@lowdefy/operators-js',
    '@lowdefy/connection-axios-http',
    'test-plugin',
  ]);

  write('node_modules/test-plugin/package.json', { name: 'test-plugin', version: '1.0.0' });
  write('node_modules/test-plugin/README.md', '# test-plugin\n\nA local test plugin.\n');
  write(
    'node_modules/test-plugin/dist/blocks/TestBlock/gallery.yaml',
    '- id: example\n  type: TestBlock\n  properties:\n    title: Hello\n'
  );

  // Feedback-loop fixtures — build status, and a JIT-built page's registry,
  // keyMap and refMap entries (see packages/build/src/build/addKeys.js for
  // the key path format: `[index:id]` / `[index:id:Type]`).
  write('build/buildStatus.json', {
    status: 'ok',
    timestamp: '2026-01-01T00:00:00.000Z',
    errors: [],
    warnings: [],
  });

  write('build/pageRegistry.json', {
    home: { pageId: 'home', auth: null, refId: 'ref-home', refPath: 'pages/home.yaml' },
    other: { pageId: 'other', auth: null, refId: 'ref-other', refPath: 'pages/other.yaml' },
    legal: { pageId: 'legal', auth: null, refId: 'ref-legal', refPath: 'pages/legal.yaml' },
    unbuilt: { pageId: 'unbuilt', auth: null, refId: 'ref-unbuilt', refPath: 'pages/unbuilt.yaml' },
  });

  // Mirrors the real dev keyMap shape: the skeleton build keys the whole
  // config (`root.pages[N:id]` page stubs only), while each JIT page build
  // runs addKeys on the page object itself — so page CONTENT keys are
  // `root.blocks[...]` with no page segment, one `root`-keyed subtree per
  // built page, distinguishable only via the ~k_parent chain. Tree roots
  // reference a parent id that is never written to keyMap.
  write('build/keyMap.json', {
    'key-root': { key: 'root', '~k_parent': 'key-root-parent' },
    'key-pages': { key: 'root.pages', '~k_parent': 'key-root', '~r': 'ref-home' },
    'key-home-stub': {
      key: 'root.pages[0:home]',
      '~k_parent': 'key-pages',
      '~r': 'ref-home',
      '~l': 1,
    },
    'key-other-stub': {
      key: 'root.pages[1:other]',
      '~k_parent': 'key-pages',
      '~r': 'ref-other',
      '~l': 1,
    },
    // JIT subtree for page "home".
    'key-home': { key: 'root', '~k_parent': 'key-home-jit-parent', '~r': 'ref-home', '~l': 1 },
    'key-button': {
      key: 'root.blocks[2:my_button:Button]',
      '~k_parent': 'key-home',
      '~r': 'ref-home',
      '~l': 5,
    },
    // List item block — config ids inside lists carry the `$` placeholder;
    // runtime block ids have array indices applied (`my_list.0.item_title`).
    'key-list-item': {
      key: 'root.blocks[3:my_list:List].blocks[0:my_list.$.item_title:Title]',
      '~k_parent': 'key-home',
      '~r': 'ref-home',
      '~l': 9,
    },
    // JIT subtree for page "other" — holds a block id that also exists on
    // home, with an IDENTICAL key shape. findConfig must scope pageId scans
    // via the ~k_parent chain, not the key path.
    'key-other': { key: 'root', '~k_parent': 'key-other-jit-parent', '~r': 'ref-other', '~l': 1 },
    'key-other-button': {
      key: 'root.blocks[0:my_button:Button]',
      '~k_parent': 'key-other',
      '~r': 'ref-other',
      '~l': 4,
    },
    // Requests over a tenant-walled and a shared connection — findConfig
    // resolves connectionId from the per-request artifact for hazards.
    'key-other-req-tenant': {
      key: 'root.requests[0:req-tenant:WriteRequest]',
      '~k_parent': 'key-other',
      '~r': 'ref-other',
      '~l': 12,
    },
    'key-other-req-shared': {
      key: 'root.requests[1:req-shared:WriteRequest]',
      '~k_parent': 'key-other',
      '~r': 'ref-other',
      '~l': 18,
    },
    // Skeleton-built page (like the default 404) — content is keyed inside
    // the global config tree with the page segment inline, and chains to the
    // shared config root rather than a page-specific one.
    'key-legal': {
      key: 'root.pages[2:legal]',
      '~k_parent': 'key-pages',
      '~r': 'ref-legal',
      '~l': 1,
    },
    'key-legal-button': {
      key: 'root.pages[2:legal].blocks[0:legal_button:Button]',
      '~k_parent': 'key-legal',
      '~r': 'ref-legal',
      '~l': 3,
    },
  });

  write('build/refMap.json', {
    'ref-home': { parent: null, path: 'pages/home.yaml' },
    'ref-other': { parent: null, path: 'pages/other.yaml' },
    'ref-legal': { parent: null, path: 'pages/legal.yaml' },
  });

  write('build/pages/home.json', {
    pageId: 'home',
    // The skeleton build keys the page's auth, chaining to the global root —
    // a real artifact carries this before any JIT-keyed block.
    auth: { public: true, '~k': 'key-home-stub' },
    blocks: [
      { id: 'my_button', type: 'Button', '~k': 'key-button' },
      {
        id: 'card',
        type: 'Card',
        slots: { content: { blocks: [{ id: 'nested_button', type: 'Button' }] } },
      },
    ],
    requests: [
      { id: 'request:home:req-read', requestId: 'req-read', payload: {} },
      { id: 'request:home:req-write', requestId: 'req-write', payload: {} },
      { id: 'request:home:req-unknown', requestId: 'req-unknown', payload: {} },
    ],
  });

  write('build/pages/other.json', {
    pageId: 'other',
    blocks: [{ id: 'my_button', type: 'Button', '~k': 'key-other-button' }],
    requests: [],
  });

  write('build/pages/legal.json', {
    pageId: 'legal',
    blocks: [{ id: 'legal_button', type: 'Button', '~k': 'key-legal-button' }],
    requests: [],
  });

  // Per-request artifacts (packages/build/src/build/full/writeRequests.js
  // strips type/connectionId/properties/auth off the page's `requests` array
  // after writing these, so a request's type is only readable here).
  write('build/pages/home/requests/req-read.json', {
    id: 'request:home:req-read',
    requestId: 'req-read',
    pageId: 'home',
    connectionId: 'axios',
    type: 'ReadOnlyRequest',
    payload: {},
    properties: {},
  });
  write('build/pages/home/requests/req-write.json', {
    id: 'request:home:req-write',
    requestId: 'req-write',
    pageId: 'home',
    connectionId: 'axios',
    type: 'WriteRequest',
    payload: {},
    properties: {},
  });
  write('build/pages/home/requests/req-unknown.json', {
    id: 'request:home:req-unknown',
    requestId: 'req-unknown',
    pageId: 'home',
    connectionId: 'axios',
    type: 'UnknownMetaRequest',
    payload: {},
    properties: {},
  });

  write('build/pages/other/requests/req-tenant.json', {
    id: 'request:other:req-tenant',
    requestId: 'req-tenant',
    pageId: 'other',
    connectionId: 'tenant_db',
    type: 'WriteRequest',
    payload: {},
    properties: {},
  });
  write('build/pages/other/requests/req-shared.json', {
    id: 'request:other:req-shared',
    requestId: 'req-shared',
    pageId: 'other',
    connectionId: 'shared_db',
    type: 'WriteRequest',
    payload: {},
    properties: {},
  });
  // Index of walled connections (packages/build/src/build/full/writeConnections.js)
  // — shared connections are never listed here.
  write('build/tenantConnections.json', [{ connectionId: 'tenant_db', type: 'MongoDBCollection' }]);

  write('build/connectionIds.json', ['axios']);
  write('build/connections/axios.json', {
    id: 'connection:axios',
    connectionId: 'axios',
    type: 'AxiosHttp',
    properties: {},
  });

  write('build/menus.json', [
    {
      id: 'menu:default',
      menuId: 'default',
      links: [
        {
          id: 'menuitem:default:home',
          menuItemId: 'home',
          type: 'MenuLink',
          pageId: 'home',
          properties: { title: 'Home' },
        },
      ],
    },
  ]);

  write('build/api/resolve_greeting.json', {
    id: 'endpoint:resolve_greeting',
    type: 'InternalApi',
    routine: [],
  });

  write('build/agents/assistant.json', {
    id: 'agent:assistant',
    agentId: 'assistant',
    type: 'OpenAiAgent',
    connectionId: 'axios',
  });

  write('build/websocketIds.json', []);

  // No cli.agentTools.allowWriteRequests — tests toggle this file directly
  // (isWriteRequestsAllowed reads it fresh, no caching) to exercise the
  // opt-in gate.
  write('lowdefy.yaml', 'lowdefy: 5.0.0\n');

  return fixtureDir;
}

export default setupTestFixtures;
