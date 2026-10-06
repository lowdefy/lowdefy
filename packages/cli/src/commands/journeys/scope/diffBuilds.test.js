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

import diffBuilds from './diffBuilds.js';
import readBuildArtifacts from './readBuildArtifacts.js';

let root;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-scope-diff-'));
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

test('diffBuilds sees no change when config only moved down a shared file', () => {
  const tickets = page({
    pageId: 'tickets',
    blocks: [block({ blockId: 'assign', k: 'b1' })],
    k: 'p1',
  });
  // The same page after a line was inserted above it in a shared file: every
  // marker and line number moved, nothing else.
  const shifted = page({
    pageId: 'tickets',
    blocks: [block({ blockId: 'assign', k: 'q7' })],
    k: 'q1',
  });
  shifted['~r'] = '4';
  shifted['~l'] = 13;
  const baseBuild = writeBuild('base', {
    'pages/tickets.json': tickets,
    'keyMap.json': { p1: { key: 'root.pages[0:tickets]', '~l': 12 } },
  });
  const headBuild = writeBuild('head', {
    'pages/tickets.json': shifted,
    'keyMap.json': { p1: { key: 'root.pages[0:tickets]', '~l': 13 } },
  });

  expect(diffBuilds({ baseBuild, headBuild })).toEqual({
    pages: [],
    requests: [],
    endpoints: [],
    connections: [],
    websockets: [],
    appWide: [],
    uncompared: [],
    removedPages: [],
  });
});

test('diffBuilds lists changed and new pages, requests, endpoints, connections, websockets and app-wide artifacts', () => {
  const baseBuild = writeBuild('base', {
    'pages/tickets.json': page({ pageId: 'tickets', blocks: [block({ blockId: 'a' })] }),
    'pages/old.json': page({ pageId: 'old' }),
    'pages/tickets/requests/get.json': {
      requestId: 'get',
      connectionId: 'db',
      properties: { q: 1 },
    },
    'pages/tickets/requests/gone.json': { requestId: 'gone', connectionId: 'db' },
    'api/assign.json': { endpointId: 'assign', routine: [] },
    'connections/db.json': { connectionId: 'db', properties: { collection: 'a' } },
    'websockets/feed.json': { websocketId: 'feed', x: 1 },
    'events.json': { onInit: [] },
  });
  const headBuild = writeBuild('head', {
    'pages/tickets.json': page({
      pageId: 'tickets',
      blocks: [block({ blockId: 'a', properties: { title: 'New' } })],
    }),
    'pages/added.json': page({ pageId: 'added' }),
    'pages/tickets/requests/get.json': {
      requestId: 'get',
      connectionId: 'db',
      properties: { q: 2 },
    },
    'pages/tickets/requests/new.json': { requestId: 'new', connectionId: 'db' },
    'api/assign.json': { endpointId: 'assign', routine: [{ id: 'x' }] },
    'connections/db.json': { connectionId: 'db', properties: { collection: 'b' } },
    'websockets/feed.json': { websocketId: 'feed', x: 2 },
    'events.json': { onInit: [{ id: 'track' }] },
  });

  expect(diffBuilds({ baseBuild, headBuild })).toEqual({
    pages: ['added', 'tickets'],
    requests: [
      { pageId: 'tickets', requestId: 'get' },
      { pageId: 'tickets', requestId: 'gone' },
      { pageId: 'tickets', requestId: 'new' },
    ],
    endpoints: ['assign'],
    connections: ['db'],
    websockets: ['feed'],
    appWide: ['events.json'],
    uncompared: [],
    removedPages: ['old'],
  });
});

test('diffBuilds lists changed uncompared files, comparing JSON ones without markers and leaving out build identity', () => {
  const baseBuild = writeBuild('base', {
    'notifications/welcome.json': { subject: 'Hi', '~k': 'a' },
    'mcp.json': { tools: [], '~k': 'a' },
    'plugins/blocks.js': 'export default {};',
    'appMeta.json': { buildId: 'one', gitSha: 'a' },
  });
  const headBuild = writeBuild('head', {
    'notifications/welcome.json': { subject: 'Hello', '~k': 'a' },
    'mcp.json': { tools: [], '~k': 'b' },
    'plugins/blocks.js': 'export default { Button };',
    'appMeta.json': { buildId: 'two', gitSha: 'b' },
  });
  const diff = diffBuilds({ baseBuild, headBuild });
  expect(diff.uncompared).toEqual(['notifications/welcome.json', 'plugins/blocks.js']);
  expect(diff.pages).toEqual([]);
});
