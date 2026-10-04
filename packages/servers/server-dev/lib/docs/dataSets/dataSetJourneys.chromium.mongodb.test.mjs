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
// plugin, over a build of the fixture app in test/app. Its connections, its module's connection and
// its auth adapter read the MONGODB_URI secret, pointed at a database of its own on the jest-mongodb
// memory server (MONGO_URL), which stands in for the developer's real database. Journeys on the
// "shop" data set must reach the data store's session database for every request, module
// connection, detached call and change stream, must never reach the auth engine, and must leave the
// stand-in exactly as they found it. The page each actor opens is a
// small HTML stand-in for a Lowdefy page (window.lowdefy state, blocks as #bl-<id>), so no client
// bundle is built. Skipped when no Chromium can be launched.

jest.setTimeout(240000);

const execFileAsync = promisify(execFile);

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDevDirectory = path.resolve(dirname, '../../..');
const appDirectory = path.join(dirname, 'test', 'app');
const originalCwd = process.cwd();
// Other mongodb suites share the memory server and run alongside this one, so the stand-in is a
// database of its own, which the suite can snapshot without seeing their writes.
const standInDatabase = 'data_set_journeys';
const standInUrl = new URL(process.env.MONGO_URL);
standInUrl.pathname = `/${standInDatabase}`;
const standInUri = standInUrl.toString();

process.env.LOWDEFY_SECRET_MONGODB_URI = standInUri;
process.env.LOWDEFY_DIRECTORY_CONFIG = appDirectory;
process.env.LOWDEFY_LOG_LEVEL = 'error';
process.env.CRON_SECRET = 'data-set-journeys-cron-secret';
process.env.LOWDEFY_SECRET_BETTER_AUTH_SECRET = 'data-set-journeys-auth-secret-0123456789abcdef';

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
const { MongoDBAuthAdapter } = await import('@lowdefy/connection-mongodb/auth/adapters');
const { ListMembers } = await import('@lowdefy/plugin-better-auth/steps');
const serverOperators = await import('@lowdefy/operators-js/operators/server');
const pluginModules = {
  [path.join('auth', 'adapters.js')]: { default: { MongoDBAuthAdapter } },
  'connections.js': { default: { MongoDBCollection } },
  'steps.js': { default: { ListMembers } },
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
const { default: authMiddleware } = await import('../../../src/routes/auth.js');
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
const { default: getBuildId } = await import('../getBuildId.js');
const { serializer } = await import('@lowdefy/helpers');

// A stand-in for a Lowdefy page: buttons call the fixture app's endpoints and keep the answer in
// page state, which journey expect steps read; "watch" subscribes to the change stream source.
function pageHtml() {
  return `<!doctype html><html><head><title>tickets</title></head><body>
<div id="bl-create"><button onclick="callEndpoint('create_ticket', { id: 'new-1', title: 'Made' }, 'created')">Create</button></div>
<div id="bl-create_later"><button onclick="callEndpoint('create_ticket_later', { id: 'later-1' }, 'dispatched')">Later</button></div>
<div id="bl-list"><button onclick="callEndpoint('list_tickets', {}, 'listed')">List</button></div>
<div id="bl-watch"><button onclick="watch()">Watch</button></div>
<div id="bl-archive"><button onclick="callEndpoint('archive/archive_ticket', { id: 'arch-1' }, 'archived')">Archive</button></div>
<div id="bl-create_later_auth"><button onclick="callEndpoint('create_ticket_later_auth', {}, 'dispatchedAuth')">Later with auth</button></div>
<div id="bl-leave"><button onclick="location.href = 'http://localhost:' + location.port + '/tickets'">Leave</button></div>
<div id="bl-auth_probe"><button onclick="probeAuth()">Auth</button></div>
<div id="bl-create_later_logged"><button onclick="callEndpoint('create_ticket_later_logged', { id: 'later-logged' }, 'dispatchedLogged')">Later, logged</button></div>
<div id="bl-create_logged"><button onclick="callEndpoint('create_ticket_logged', { id: 'new-logged' }, 'createdLogged')">Create, logged</button></div>
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
async function probeAuth() {
  const signUp = await fetch('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'journey@example.com', password: 'journey-password', name: 'Journey' }),
  });
  const signIn = await fetch('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'developer@example.com', password: 'developer-password' }),
  });
  const session = await fetch('/api/auth/get-session');
  const sessionBody = await session.json();
  state.auth = {
    signUp: signUp.status,
    signIn: signIn.status,
    session: session.status,
    sessionUser: sessionBody.user ? sessionBody.user.id : null,
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

// The Host header of every request the server answers, so a test can tell that a request to the
// server's other host never arrived.
const seenHosts = [];

function createApp() {
  const app = new Hono();
  app.use('*', async (c, next) => {
    seenHosts.push(c.req.header('host'));
    await next();
  });
  app.post('/lowdefy-docs/journey', docsJourneyHandler);
  app.use('/api/*', apiContext());
  // As src/app.js mounts them: the get-session stub answers for injected callers, and every other
  // auth route reaches the auth engine, or a 404 under a data session.
  app.get('/api/auth/get-session', async (c, next) => {
    const context = c.get('lowdefyContext');
    if (context.user) return c.json({ session: { id: 'dev' }, user: context.user });
    return next();
  });
  app.use('/api/auth/*', authMiddleware({ logger: { warn: () => {}, error: console.error } }));
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
let standInBefore;

// Every collection of the stand-in database (app data and the auth engine's user-* collections),
// with every document in it.
async function snapshotStandIn() {
  const db = standIn.db(standInDatabase);
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const snapshot = {};
  for (const { name } of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    snapshot[name] = await db.collection(name).find({}).sort({ _id: 1 }).toArray();
  }
  return snapshot;
}

async function standInSessionDatabases() {
  const { databases } = await standIn.db('admin').admin().listDatabases({ nameOnly: true });
  return databases.map((database) => database.name).filter((name) => name.startsWith('ld_'));
}

// The developer's own tab, with no journey cookie: it reaches the auth engine, which writes to the
// stand-in.
async function signUpWithoutCookies() {
  const response = await fetch(`${origin}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({
      email: 'developer@example.com',
      password: 'developer-password',
      name: 'Developer',
    }),
  });
  return response.status;
}

beforeAll(async () => {
  standIn = new MongoClient(standInUri);
  await standIn.connect();
  await standIn.db(standInDatabase).dropDatabase();
  await standIn
    .db(standInDatabase)
    .collection('tickets')
    .insertOne({ _id: 'real-1', organization_id: 'org_a', title: 'The developer’s own' });

  store = await getDataStore();
  // Every write on the data store, in order, so a test can tell which session database a detached
  // write reached and that it landed before the session dropped it.
  storeEvents = [];
  storeWatch = store.client.watch([], { fullDocument: 'default' });
  storeWatch.on('change', (change) => {
    storeEvents.push({
      operationType: change.operationType,
      db: change.ns?.db,
      coll: change.ns?.coll,
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

  // The auth engine is live for the developer's tab: its sign-up writes a user, a session and the
  // organization the tenant policy mints. The snapshot is taken after it, so every auth collection
  // on the stand-in already holds documents a journey could add to.
  expect(await signUpWithoutCookies()).toBe(200);
  standInBefore = await snapshotStandIn();
  expect(standInBefore.users).toHaveLength(1);
  expect(standInBefore['user-sessions']).toHaveLength(1);
});

afterAll(async () => {
  await browser?.close();
  await storeWatch?.close();
  wss?.close();
  await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
  await closeClients();
  await store?.stop();
  await standIn?.db(standInDatabase).dropDatabase();
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
  const documents = await standIn
    .db(standInDatabase)
    .collection('tickets')
    .find({})
    .sort({ _id: 1 })
    .toArray();
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
    await standIn
      .db(standInDatabase)
      .collection('tickets')
      .insertOne({ _id: 'real-2', organization_id: 'org_a' });
    const { result } = await journey;
    expect(result.passed).toBe(true);
    expect(result.state.changes).toEqual(['watched-1']);
    await standIn.db(standInDatabase).collection('tickets').deleteOne({ _id: 'real-2' });
    expect(await standInIds()).toEqual(['real-1']);
  }
);

chromiumTest(
  'a journey that writes through a module connection writes to its session database',
  async () => {
    storeEvents.length = 0;
    const { result } = await runJourney({
      data: 'shop',
      user: 'owner',
      steps: [
        { click: 'archive' },
        { expect: { state: { path: 'archived.success', equals: true } } },
      ],
    });
    expect(result.passed).toBe(true);
    const insert = storeEvents.find(
      (event) => event.operationType === 'insert' && event.id === 'arch-1'
    );
    expect(insert).toBeDefined();
    expect(insert.db).toMatch(/^ld_[0-9a-f]{12}$/);
    expect(insert.coll).toEqual('archived');
  }
);

chromiumTest(
  "a data set journey's browser gets 404 from the auth routes and the get-session stub answers for its user",
  async () => {
    const { result } = await runJourney({
      data: 'shop',
      user: 'owner',
      steps: [
        { click: 'auth_probe' },
        { expect: { state: { path: 'auth.session', equals: 200 } } },
      ],
    });
    expect(result.passed).toBe(true);
    expect(result.state.auth).toEqual({
      signUp: 404,
      signIn: 404,
      session: 200,
      sessionUser: 'u_1',
    });
  }
);

chromiumTest(
  'a detached run that reaches an auth step under a data session fails at that step',
  async () => {
    storeEvents.length = 0;
    const { result } = await runJourney({
      data: 'shop',
      user: 'owner',
      steps: [
        { click: 'create_later_auth' },
        { expect: { state: { path: 'dispatchedAuth.success', equals: true } } },
      ],
    });
    expect(result.passed).toBe(true);
    // The session waited for the detached run before it closed: the step before the auth step
    // wrote to the session database, and the step after it never ran.
    const before = storeEvents.find(
      (event) => event.operationType === 'insert' && event.id === 'later-auth-before'
    );
    expect(before).toBeDefined();
    expect(before.db).toMatch(/^ld_[0-9a-f]{12}$/);
    expect(storeEvents.some((event) => event.id === 'later-auth-after')).toBe(false);
  }
);

chromiumTest(
  "a data set journey that navigates to the dev server's other host fails, and the server never sees it",
  async () => {
    const port = new URL(origin).port;
    // The other host reaches this server: without a journey's browser in the way, it answers.
    const reachable = await fetch(`http://localhost:${port}/tickets`);
    expect(reachable.status).toBe(200);
    seenHosts.length = 0;
    const { result } = await runJourney({
      data: 'shop',
      user: 'owner',
      steps: [{ click: 'leave' }, { click: 'list' }],
    });
    expect(result.passed).toBe(false);
    expect(result.failure.index).toBe(0);
    expect(result.failure.message).toEqual(
      `Journey left its origin ${origin} for http://localhost:${port}/tickets; a data set journey must stay on one host of the dev server.`
    );
    expect(result.steps.map((step) => step.status)).toEqual(['failed', 'skipped']);
    expect(seenHosts.length).toBeGreaterThan(0);
    expect(seenHosts.filter((host) => host.startsWith('localhost'))).toEqual([]);
  }
);

// A drop-step mutant on an endpoint's "log" step, as `lowdefy journeys harden` sends it: the step's
// ~k in the build the server is serving.
function dropLogMutant(endpointId) {
  const endpoint = serializer.deserializeFromString(
    fs.readFileSync(path.join(serverDirectory, 'build', 'api', `${endpointId}.json`), 'utf8')
  );
  const log = endpoint.routine.find((step) => step.stepId === 'log');
  return {
    buildId: getBuildId(),
    artifact: `api/${endpointId}.json`,
    key: log['~k'],
    arg: null,
    operator: 'drop-step',
  };
}

chromiumTest(
  'a mutant on an endpoint reached only through a detached CallApi applies, and the detached target writes to the session database',
  async () => {
    storeEvents.length = 0;
    const { status, result } = await runJourney({
      data: 'shop',
      user: 'owner',
      mutant: dropLogMutant('insert_detached_logged'),
      steps: [
        { click: 'create_later_logged' },
        { expect: { state: { path: 'dispatchedLogged.success', equals: true } } },
      ],
    });
    expect(status).toBe(200);
    expect(result.passed).toBe(true);
    // The detached request carried the mutant cookie: its read of the endpoint dropped "log".
    expect(result.mutant.applied).toBeGreaterThanOrEqual(1);
    expect(result.mutant.misses).toEqual([]);
    // And the data cookie: its insert reached the session's database, not the stand-in.
    const insert = storeEvents.find(
      (event) => event.operationType === 'insert' && event.id === 'later-logged'
    );
    expect(insert).toBeDefined();
    expect(insert.db).toMatch(/^ld_[0-9a-f]{12}$/);
    expect(storeEvents.some((event) => event.id === 'log-detached')).toBe(false);
    expect(await standInIds()).toEqual(['real-1']);
  }
);

chromiumTest(
  'two mutant runs of a data-set journey at once, as two harden workers run them, never see each other’s writes',
  async () => {
    const mutant = dropLogMutant('create_ticket_logged');
    const journey = {
      data: 'shop',
      user: 'owner',
      mutant,
      steps: [
        { click: 'create_logged' },
        { expect: { state: { path: 'createdLogged.success', equals: true } } },
        { wait: { ms: 1000 } },
        { click: 'list' },
        { expect: { state: { path: 'listed.ids', equals: ['new-logged', 't-a1', 't-a2'] } } },
      ],
    };
    const runs = await Promise.all([runJourney(journey), runJourney(journey)]);
    runs.forEach(({ status, result }) => {
      expect(status).toBe(200);
      // Each inserted new-logged into a database of its own: in a shared one the second insert of
      // that _id would fail, and each list would show both runs' rows.
      expect(result.passed).toBe(true);
      expect(result.mutant.applied).toBeGreaterThanOrEqual(1);
    });
    expect(runs[0].result.mutant.id).not.toEqual(runs[1].result.mutant.id);
    expect(await standInIds()).toEqual(['real-1']);
  }
);

// Last, after every journey above: the stand-in, auth collections included, is exactly as the
// snapshot found it, and no session database ever landed on it.
chromiumTest('the data set journeys left the stand-in database unchanged', async () => {
  expect(await snapshotStandIn()).toEqual(standInBefore);
  expect(await standInSessionDatabases()).toEqual([]);
});
