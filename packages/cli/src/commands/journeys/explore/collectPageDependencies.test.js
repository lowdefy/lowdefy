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

import collectPageDependencies from './collectPageDependencies.js';
import readBuildArtifacts from './readBuildArtifacts.js';

let root;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-explore-diff-'));
});
afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

// A build directory with the artifacts given (path → JSON value or string),
// plus the keyMap.json and refMap.json every build writes.
function writeBuild(name, files) {
  const directory = path.join(root, name);
  const all = {
    'keyMap.json': {},
    'refMap.json': {},
    'menus.json': [],
    'config.json': {},
    ...files,
  };
  Object.entries(all).forEach(([file, value]) => {
    const filePath = path.join(directory, file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, typeof value === 'string' ? value : JSON.stringify(value));
  });
  return readBuildArtifacts({ buildDirectory: directory });
}

function page({ pageId, blocks = [], events, auth = { public: true }, k = 'p' }) {
  return {
    id: `page:${pageId}`,
    type: 'Box',
    auth: { ...auth, '~k': `${k}a` },
    pageId,
    blockId: pageId,
    ...(events ? { events } : {}),
    slots: { content: { blocks: { '~arr': blocks, '~k': `${k}b` } } },
    '~k': k,
  };
}

function block({ blockId, type = 'Button', properties = {}, events, k = blockId, blocks }) {
  return {
    id: `block:x:${blockId}:0`,
    type,
    blockId,
    properties: { ...properties, '~k': `${k}p` },
    ...(events ? { events } : {}),
    ...(blocks ? { slots: { content: { blocks: { '~arr': blocks } } } } : {}),
    '~k': k,
  };
}

function callApi(endpointId) {
  return { onClick: { try: [{ id: 'call', type: 'CallAPI', params: { endpointId } }] } };
}

test('collectPageDependencies follows CallAPI into endpoints that call endpoints, and their connections', () => {
  const build = writeBuild('head', {
    'pages/tickets.json': page({
      pageId: 'tickets',
      blocks: [block({ blockId: 'assign', events: callApi('assign') })],
      events: { onMount: { try: { '~arr': [{ id: 'fetch', type: 'Request', params: 'get' }] } } },
    }),
    'pages/tickets/requests/get.json': { requestId: 'get', connectionId: 'tickets_db' },
    'api/assign.json': {
      endpointId: 'assign',
      routine: {
        '~arr': [
          { id: 'request:assign:update', connectionId: 'tickets_db' },
          { ':if': true, ':then': [{ type: 'CallApi', properties: { endpointId: 'notify' } }] },
        ],
      },
    },
    'api/notify.json': {
      endpointId: 'notify',
      routine: [
        { id: 'request:notify:send', connectionId: 'mailer' },
        { type: 'CallApi', properties: { endpointId: 'assign' } },
      ],
    },
    'api/unused.json': { endpointId: 'unused', routine: [{ connectionId: 'other' }] },
  });

  expect(collectPageDependencies({ build, pageId: 'tickets' })).toEqual({
    requests: ['get'],
    endpoints: ['assign', 'notify'],
    connections: ['mailer', 'tickets_db'],
    websockets: [],
  });
});

test('collectPageDependencies lists websockets from page subscriptions and Subscribe actions', () => {
  const tickets = page({
    pageId: 'tickets',
    blocks: [
      block({
        blockId: 'live',
        events: {
          onClick: {
            try: [
              { id: 's1', type: 'Subscribe', params: { websocketId: 'feed' } },
              { id: 's2', type: 'Subscribe', params: 'alerts' },
              { id: 's3', type: 'Subscribe', params: { websocketId: { _state: 'which' } } },
            ],
          },
        },
      }),
    ],
  });
  tickets.subscriptions = { '~arr': [{ websocketId: 'presence', payload: {} }] };
  const build = writeBuild('head', { 'pages/tickets.json': tickets });

  expect(collectPageDependencies({ build, pageId: 'tickets' }).websockets).toEqual([
    'alerts',
    'feed',
    'presence',
  ]);
});

test('collectPageDependencies skips a CallAPI naming an endpoint with no artifact', () => {
  const build = writeBuild('head', {
    'pages/tickets.json': page({
      pageId: 'tickets',
      blocks: [block({ blockId: 'assign', events: callApi('missing') })],
    }),
  });
  expect(collectPageDependencies({ build, pageId: 'tickets' })).toEqual({
    requests: [],
    endpoints: ['missing'],
    connections: [],
    websockets: [],
  });
});
