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
      SetState: { package: '@lowdefy/actions-core', originalTypeName: 'SetState', version: '5.0.0' },
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
        _secret: { package: '@lowdefy/operators-js', originalTypeName: '_secret', version: '5.0.0' },
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
    Button: { category: 'display' },
    TestBlock: { category: 'input', valueType: 'string' },
  });
  write('build/plugins/actionSchemas.json', { SetState: { type: 'object' } });
  write('build/plugins/operatorSchemas.json', { _get: { params: { type: 'object' } } });
  write('build/plugins/connectionSchemas.json', {
    AxiosHttp: { schema: { type: 'object' }, requests: ['AxiosHttp'] },
  });
  write('build/plugins/requestSchemas.json', {
    AxiosHttp: { schema: { type: 'object' }, meta: { checkRead: false, checkWrite: false } },
    ReadOnlyRequest: { schema: { type: 'object' }, meta: { checkRead: true, checkWrite: false } },
    WriteRequest: { schema: { type: 'object' }, meta: { checkRead: true, checkWrite: true } },
    // No "meta" at all — some custom plugins don't declare it; treated as unknown.
    UnknownMetaRequest: { schema: { type: 'object' } },
  });
  write('build/customTypesMap.json', {
    blocks: { TestBlock: { package: 'test-plugin', originalTypeName: 'TestBlock', version: '1.0.0' } },
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
    unbuilt: { pageId: 'unbuilt', auth: null, refId: 'ref-unbuilt', refPath: 'pages/unbuilt.yaml' },
  });

  write('build/keyMap.json', {
    'key-root': { key: 'root', '~k_parent': null },
    'key-pages': { key: 'root.pages', '~k_parent': 'key-root', '~r': 'ref-home' },
    'key-home': {
      key: 'root.pages[0:home]',
      '~k_parent': 'key-pages',
      '~r': 'ref-home',
      '~l': 1,
    },
    'key-button': {
      key: 'root.pages[0:home].blocks[2:my_button:Button]',
      '~k_parent': 'key-home',
      '~r': 'ref-home',
      '~l': 5,
    },
    // List item block — config ids inside lists carry the `$` placeholder;
    // runtime block ids have array indices applied (`my_list.0.item_title`).
    'key-list-item': {
      key: 'root.pages[0:home].blocks[3:my_list:List].blocks[0:my_list.$.item_title:Title]',
      '~k_parent': 'key-home',
      '~r': 'ref-home',
      '~l': 9,
    },
  });

  write('build/refMap.json', {
    'ref-home': { parent: null, path: 'pages/home.yaml' },
  });

  write('build/pages/home.json', {
    pageId: 'home',
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
