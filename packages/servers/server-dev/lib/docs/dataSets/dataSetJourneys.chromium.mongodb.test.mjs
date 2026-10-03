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

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { jest } from '@jest/globals';
import { MongoClient } from 'mongodb';

// Data set journeys end to end: a real Chromium drives journeys through the dev server's own
// journey route, API context, endpoint, detached and websocket handlers and the MongoDB connection
// plugin, over a build of the fixture app in test/app. Its connection reads the MONGODB_URI secret,
// pointed at the jest-mongodb memory server (MONGO_URL), which stands in for the developer's real
// database. Journeys on the "shop" data set must reach the data store's session database for every
// request, detached call and change stream, and never the stand-in. The page each actor opens is a
// small HTML stand-in for a Lowdefy page (window.lowdefy state, blocks as #bl-<id>), so no client
// bundle is built. Skipped when no Chromium can be launched.

jest.setTimeout(240000);

const execFileAsync = promisify(execFile);

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDevDirectory = path.resolve(dirname, '../../..');
const appDirectory = path.join(dirname, 'test', 'app');
const originalCwd = process.cwd();
const standInUri = process.env.MONGO_URL;

process.env.LOWDEFY_SECRET_MONGODB_URI = standInUri;
process.env.LOWDEFY_DIRECTORY_CONFIG = appDirectory;
process.env.LOWDEFY_LOG_LEVEL = 'error';
process.env.CRON_SECRET = 'data-set-journeys-cron-secret';

// createLowdefyContext imports the app's plugin maps from server-dev/build/plugins, which only a
// built server directory has: they are materialised for the import (like
// createLowdefyContext.test.mjs) and mocked with the real plugins the fixture app uses.
const pluginsDirectory = path.join(serverDevDirectory, 'build', 'plugins');
const pluginFiles = [
  'agents.js',
  path.join('auth', 'adapters.js'),
  path.join('auth', 'providers.js'),
  path.join('auth', 'strategies.js'),
  'connections.js',
  'notifications.js',
  path.join('operators', 'server.js'),
  path.join('operators', 'serverJsMap.js'),
  'steps.js',
  'websockets.js',
].map((file) => path.join(pluginsDirectory, file));
const createdPluginFiles = [];
pluginFiles.forEach((filePath) => {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, 'export default {};\n');
    createdPluginFiles.push(filePath);
  }
});
const { MongoDBCollection } = await import('@lowdefy/connection-mongodb/connections');
const { MongoDBChangeStream } = await import('@lowdefy/connection-mongodb/websockets');
const serverOperators = await import('@lowdefy/operators-js/operators/server');
const pluginModules = {
  'connections.js': { default: { MongoDBCollection } },
  'websockets.js': { default: { MongoDBChangeStream } },
  [path.join('operators', 'server.js')]: { default: { ...serverOperators } },
  'notifications.js': { default: {}, interpolateProperties: () => {}, renderEmail: () => {} },
};
pluginFiles.forEach((filePath) => {
  const relative = path.relative(pluginsDirectory, filePath);
  jest.unstable_mockModule(filePath, () => pluginModules[relative] ?? { default: {} });
});

// The fixture app's build, in a temporary server directory: lib/build/*.js read build/*.json from
// the working directory when they are imported.
const serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-data-set-journeys-'));
await execFileAsync(process.execPath, [
  path.join(dirname, 'test', 'buildTestApp.mjs'),
  appDirectory,
  serverDirectory,
]);
process.chdir(serverDirectory);

const { Hono } = await import('hono');
const { serve } = await import('@hono/node-server');
const { WebSocketServer } = await import('ws');
const { default: apiContext } = await import('../../../src/middleware/apiContext.js');
const { default: createErrorHandler } = await import('../../../src/middleware/errorHandler.js');
const { default: detachedHandler } = await import('../../../src/routes/detached.js');
const { default: docsJourneyHandler } = await import('../../../src/routes/docs/journey.js');
const { default: endpointsHandler } = await import('../../../src/routes/endpoints.js');
const { default: websocketHandler } = await import('../../../src/routes/websocket.js');
const { handleWebSocketUpgrade } = await import('../../../src/websocket/devWebSocket.js');
const { getBrowser } = await import('../getBrowser.js');
// The connection plugin keeps one driver client per URI for the life of the process; the suite
// closes them so jest can exit. Imported by file: the package does not export it.
const { closeClients } = await import(
  path.join(
    serverDevDirectory,
    'node_modules/@lowdefy/connection-mongodb/dist/connections/MongoDBCollection/getClient.js'
  )
);
const { default: getDataStore } = await import('./getDataStore.js');

// A stand-in for a Lowdefy page: buttons call the fixture app's endpoints and keep the answer in
// page state, which journey expect steps read; "watch" subscribes to the change stream source.
function pageHtml() {
  return `<!doctype html><html><head><title>tickets</title></head><body>
<div id="bl-create"><button onclick="callEndpoint('create_ticket', { id: 'new-1', title: 'Made' }, 'created')">Create</button></div>
<div id="bl-create_later"><button onclick="callEndpoint('create_ticket_later', { id: 'later-1' }, 'dispatched')">Later</button></div>
<div id="bl-list"><button onclick="callEndpoint('list_tickets', {}, 'listed')">List</button></div>
<div id="bl-watch"><button onclick="watch()">Watch</button></div>
<div id="bl-create_watched"><button onclick="callEndpoint('create_ticket', { id: 'watched-1', title: 'Seen' }, 'createdWatched')">Create watched</button></div>
<script>
window.lowdefy = {
  pageId: 'tickets',
  contexts: {
    'page:tickets': {
      state: { changes: [] },
      requests: {},
      websockets: {},
      _internal: { onInitDone: true, onInitAsyncDone: true, RootSlots: { map: {} } },
    },
  },
};
const state = window.lowdefy.contexts['page:tickets'].state;
async function callEndpoint(endpointId, payload, key) {
  const response = await fetch('/api/endpoints/' + endpointId, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ payload }),
  });
  const body = await response.json();
  state[key] = {
    status: response.status,
    success: body.success === true,
    ids: Array.isArray(body.response) ? body.response.map((document) => document._id) : null,
  };
}
function watch() {
  const socket = new WebSocket('ws://' + location.host + '/api/websocket');
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'subscribe', websocketId: 'ticket_changes', requestId: 'r1', payload: {} }));
  };
  socket.onmessage = (event) => {
    const frame = JSON.parse(event.data);
    if (frame.type === 'subscribed') state.subscribed = true;
    const id = JSON.stringify(frame).match(/"documentKey":\\{"_id":"([^"]+)"/);
    if (id !== null) state.changes = [...state.changes, id[1]];
  };
}
</script></body></html>`;
}

function createApp() {
  const app = new Hono();
  app.post('/lowdefy-docs/journey', docsJourneyHandler);
  app.use('/api/*', apiContext());
  app.all('/api/endpoints/*', endpointsHandler);
  app.post('/api/detached/*', detachedHandler);
  app.get('/api/websocket', websocketHandler);
  app.get('/tickets', (c) => c.html(pageHtml()));
  app.onError(createErrorHandler({ logger: { warn: () => {}, error: console.error } }));
  return app;
}

let browser = null;
try {
  browser = await getBrowser();
} catch {
  browser = null;
}
const chromiumTest = browser === null ? test.skip : test;

let server;
let wss;
let origin;
let standIn;
let store;
let storeEvents;
let storeWatch;

beforeAll(async () => {
  standIn = new MongoClient(standInUri);
  await standIn.connect();
  await standIn.db().collection('tickets').deleteMany({});
  await standIn
    .db()
    .collection('tickets')
    .insertOne({ _id: 'real-1', organizationId: 'org_a', title: 'The developer’s own' });

  store = await getDataStore();
  // Every write on the data store, in order, so a test can tell which session database a detached
  // write reached and that it landed before the session dropped it.
  storeEvents = [];
  storeWatch = store.client.watch([], { fullDocument: 'default' });
  storeWatch.on('change', (change) => {
    storeEvents.push({
      operationType: change.operationType,
      db: change.ns?.db,
      id: change.documentKey?._id,
    });
  });
  await new Promise((resolve) => setTimeout(resolve, 200));

  const app = createApp();
  wss = new WebSocketServer({ noServer: true });
  server = serve({ fetch: app.fetch, port: 0, hostname: '127.0.0.1' });
  server.on('upgrade', (request, socket, head) => {
    handleWebSocketUpgrade({ app, request, socket, head, wss });
  });
  await new Promise((resolve) => {
    if (server.listening) resolve();
    else server.once('listening', resolve);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await browser?.close();
  await storeWatch?.close();
  wss?.close();
  await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
  await closeClients();
  await store?.stop();
  await standIn?.close();
  process.chdir(originalCwd);
  fs.rmSync(serverDirectory, { recursive: true, force: true });
  createdPluginFiles.forEach((filePath) => fs.rmSync(filePath, { force: true }));
});

async function runJourney(body) {
  const response = await fetch(`${origin}/lowdefy-docs/journey`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pageId: 'tickets', timeout: 10000, state: true, ...body }),
  });
  return { status: response.status, result: await response.json() };
}

async function standInIds() {
  const documents = await standIn.db().collection('tickets').find({}).sort({ _id: 1 }).toArray();
  return documents.map((document) => document._id);
}

async function listAllWithoutCookies() {
  const response = await fetch(`${origin}/api/endpoints/list_all_tickets`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ payload: {} }),
  });
  const body = await response.json();
  return body.response.map((document) => document._id);
}

chromiumTest(
  'a data-set journey writes to its own database, and the next journey on the data set does not see the write',
  async () => {
    const first = await runJourney({
      data: 'shop',
      user: 'owner',
      steps: [
        { click: 'create' },
        { expect: { state: { path: 'created.success', equals: true } } },
        { click: 'list' },
        { expect: { state: { path: 'listed.ids', equals: ['new-1', 't-a1', 't-a2'] } } },
      ],
    });
    expect(first.status).toBe(200);
    expect(first.result.passed).toBe(true);
    expect(first.result.data).toEqual({ name: 'shop', loadMs: expect.any(Number), snapshot: null });

    const second = await runJourney({
      data: 'shop',
      user: 'owner',
      steps: [
        { click: 'list' },
        { expect: { state: { path: 'listed.ids', equals: ['t-a1', 't-a2'] } } },
      ],
    });
    expect(second.result.passed).toBe(true);
    expect(await standInIds()).toEqual(['real-1']);
  }
);

chromiumTest(
  'a cookieless request to the same server reads the stand-in database while a data journey runs',
  async () => {
    const journey = runJourney({
      data: 'shop',
      user: 'owner',
      steps: [
        { click: 'create' },
        { expect: { state: { path: 'created.success', equals: true } } },
        { wait: { ms: 1500 } },
        { click: 'list' },
        { expect: { state: { path: 'listed.ids', equals: ['new-1', 't-a1', 't-a2'] } } },
      ],
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(await listAllWithoutCookies()).toEqual(['real-1']);
    const { result } = await journey;
    expect(result.passed).toBe(true);
    expect(await standInIds()).toEqual(['real-1']);
  }
);

chromiumTest('as: outsider acts as that data set user and sees only its own org', async () => {
  const { result } = await runJourney({
    data: 'shop',
    user: 'owner',
    steps: [
      { click: 'list' },
      { expect: { state: { path: 'listed.ids', equals: ['t-a1', 't-a2'] } } },
      { as: 'outsider' },
      { click: 'list' },
      { expect: { state: { path: 'listed.ids', equals: ['t-b1'] } } },
    ],
  });
  expect(result.passed).toBe(true);
});

chromiumTest(
  'a detached CallApi on the last step writes to the session database before the session drops it',
  async () => {
    storeEvents.length = 0;
    const { result } = await runJourney({
      data: 'shop',
      user: 'owner',
      steps: [
        { click: 'create_later' },
        { expect: { state: { path: 'dispatched.success', equals: true } } },
      ],
    });
    expect(result.passed).toBe(true);
    // The session closed when the journey answered; by then the detached run had written.
    const insert = storeEvents.find(
      (event) => event.operationType === 'insert' && event.id === 'later-1'
    );
    expect(insert).toBeDefined();
    expect(insert.db).toMatch(/^ld_[0-9a-f]{12}$/);
    const insertIndex = storeEvents.indexOf(insert);
    const dropIndex = storeEvents.findIndex(
      (event) => event.operationType === 'dropDatabase' && event.db === insert.db
    );
    expect(dropIndex).toBeGreaterThan(insertIndex);
    expect(await standInIds()).toEqual(['real-1']);
  }
);

chromiumTest(
  "a change stream source on a redirected connection delivers the session's changes and not the stand-in's",
  async () => {
    const journey = runJourney({
      data: 'shop',
      user: 'owner',
      steps: [
        { click: 'watch' },
        { expect: { state: { path: 'subscribed', equals: true } } },
        { wait: { ms: 1500 } },
        { click: 'create_watched' },
        { expect: { state: { path: 'createdWatched.success', equals: true } } },
        { expect: { state: { path: 'changes', equals: ['watched-1'] } } },
        { wait: { ms: 1500 } },
      ],
    });
    // Written to the stand-in while the journey watches: its stream must not deliver it.
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await standIn.db().collection('tickets').insertOne({ _id: 'real-2', organizationId: 'org_a' });
    const { result } = await journey;
    expect(result.passed).toBe(true);
    expect(result.state.changes).toEqual(['watched-1']);
    await standIn.db().collection('tickets').deleteOne({ _id: 'real-2' });
    expect(await standInIds()).toEqual(['real-1']);
  }
);
