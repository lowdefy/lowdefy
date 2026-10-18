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

import { jest } from '@jest/globals';

import createAppAuth from './createAppAuth.js';
import createAppSession from '../session/createAppSession.js';
import createFakeServer, { header } from '../test/createFakeServer.js';
import createMemoryCacheStore from '../test/createMemoryCacheStore.js';
import createMemoryStore from '../host/createMemoryStore.js';
import getAuthView from './getAuthView.js';
import { createPages, createRoot } from '../test/fixtures.js';

jest.mock('expo-secure-store', () =>
  jest.requireActual('../test/createFakeSecureStore.js').default()
);
jest.mock('expo-crypto', () => ({}));
jest.mock('expo-web-browser', () => ({}));
jest.mock('expo-local-authentication', () => ({}));

const SecureStore = jest.requireMock('expo-secure-store');

const apiBase = 'https://field.example.com';
const app = { id: 'field', name: 'Field', urls: { production: apiBase } };
const standardShell = { id: 'field', scheme: 'com.example.field', profile: 'standard' };
const trackingShell = { ...standardShell, profile: 'field-tracking' };
const SIGNED_IN = 'c-ana; session=s1; roles=r1';

const settings = { emailCode: true, unlock: 'none', unlockAfter: 300, sharedDevice: false };

function response({ body = {}, headers = {}, status = 200 }) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name.toLowerCase()] ?? null },
    json: async () => structuredClone(body),
  };
}

// The fake Lowdefy server, with Better Auth's sign-in and sign-out routes and sessions: a call
// answers as the person its bearer token belongs to, or as the signed-out caller.
function createServer({ auth = settings } = {}) {
  const sessions = new Set();
  const server = createFakeServer({
    root: createRoot({ auth }),
    rootEtag: '"root-1"',
    pages: createPages([
      ['today', 'today', '"p-today-1"'],
      ['jobs', 'jobs', '"p-jobs-1"'],
      ['jobs/{job_id}', 'job', '"p-job-1"'],
    ]),
  });
  const serve = server.fetch.getMockImplementation();
  server.fetch.mockImplementation(async (url, init = {}) => {
    const { pathname } = new URL(url);
    const body = init.body ? JSON.parse(init.body) : {};
    const token = header(init, 'authorization')?.slice('Bearer '.length) ?? null;
    const signedIn = token !== null && sessions.has(token);
    if (pathname === '/api/auth/sign-in/email-otp') {
      if (body.otp !== '123456') return response({ status: 400, body: { code: 'INVALID_OTP' } });
      sessions.add('token-1');
      return response({ body: { token: 'unsigned' }, headers: { 'set-auth-token': 'token-1' } });
    }
    if (pathname === '/api/auth/sign-out') {
      sessions.delete(token);
      return response({ body: { success: true } });
    }
    if (pathname === '/api/endpoints/admin') {
      return response({ status: 403, headers: { 'x-lowdefy-caller': SIGNED_IN } });
    }
    if (pathname.startsWith('/api/request/') && !signedIn) {
      return response({ status: 401, headers: { 'x-lowdefy-caller': '' } });
    }
    server.state.caller = signedIn ? SIGNED_IN : '';
    server.state.user = signedIn ? { id: 'ana' } : null;
    return serve(url, init);
  });
  return { server, sessions };
}

function createFakeAppState() {
  let listener = null;
  return {
    addEventListener: (type, fn) => {
      listener = fn;
      return { remove: () => (listener = null) };
    },
    emit: (next) => listener?.(next),
  };
}

async function until(check) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error('Timed out.');
}

async function setup({
  cacheStore = createMemoryCacheStore(),
  kv = createMemoryStore(),
  server = createServer().server,
  shell = standardShell,
} = {}) {
  const clock = { now: 0 };
  const appState = createFakeAppState();
  const localAuthentication = { authenticateAsync: jest.fn(async () => ({ success: true })) };
  const onSignedOut = jest.fn();
  const auth = createAppAuth({
    apiBase,
    app,
    appState,
    cacheStore,
    fetch: server.fetch,
    kv,
    localAuthentication,
    now: () => clock.now,
    onSignedOut,
    shell,
  });
  const session = createAppSession({
    apiBase,
    app,
    cacheStore: auth.sessionStores.cacheStore,
    fetch: auth.fetch,
    kv: auth.sessionStores.kv,
    tokenStore: auth.tokenStore,
  });
  await auth.start({ session });
  const view = () => getAuthView({ auth: auth.getState(), session: session.getState() });
  return { appState, auth, cacheStore, clock, kv, localAuthentication, onSignedOut, session, view };
}

async function signIn(context) {
  await until(() => context.view() === 'signIn');
  expect(await context.auth.signInWithCode({ email: 'ana@example.com', otp: '123456' })).toEqual({
    status: 'signedIn',
  });
  await until(() => context.session.getState().cacheKey === 'field:c-ana:r1');
  await until(() => context.session.getState().status === 'ready');
}

beforeEach(() => {
  SecureStore.items.clear();
});

test('an app with auth asks for sign-in when nobody is signed in, and keeps its settings', async () => {
  const context = await setup();
  await until(() => context.view() === 'signIn');
  expect(JSON.parse(context.kv.get('lowdefy-shell:auth:field'))).toEqual({
    settings,
    slug: 'field',
  });
});

test('an app without auth opens without a sign-in screen', async () => {
  const context = await setup({ server: createServer({ auth: null }).server });
  await until(() => context.session.getState().status === 'ready');
  expect(context.view()).toBe('app');
});

test('signing in by email code keeps the token and opens the app as the person', async () => {
  const context = await setup();
  await signIn(context);
  expect(context.auth.tokenStore.get()).toBe('token-1');
  expect(SecureStore.items.get('lowdefy-session-token.field|no-auth').value).toBe('token-1');
  expect(context.view()).toBe('app');
  expect(context.session.getState().user).toEqual({ id: 'ana' });
});

test('a wrong code signs nobody in', async () => {
  const context = await setup();
  await until(() => context.view() === 'signIn');
  expect(await context.auth.signInWithCode({ email: 'ana@example.com', otp: '000000' })).toEqual({
    status: 'invalid',
  });
  expect(context.auth.tokenStore.get()).toBeNull();
  expect(context.view()).toBe('signIn');
});

function keepPersonData(kv) {
  kv.set('lowdefy:field::lowdefy_user:ana:draft', '{"note":"x"}');
  kv.set('lowdefy:field::theme', 'dark');
}

function expectPurged(context) {
  expect(context.auth.tokenStore.get()).toBeNull();
  expect(SecureStore.items.size).toBe(0);
  expect([...context.cacheStore.roots.keys()]).toEqual([]);
  expect(context.kv.get('lowdefy-shell:last-cache-key:field')).toBeNull();
  expect(context.kv.get('lowdefy:field::lowdefy_user:ana:draft')).toBeNull();
  expect(context.kv.get('lowdefy:field::theme')).toBe('dark');
}

test('sign-out ends the session on the server and removes the person from the phone', async () => {
  const { server, sessions } = createServer();
  const context = await setup({ server });
  await signIn(context);
  keepPersonData(context.kv);
  await context.auth.signOut();
  const signOutCall = server.fetch.mock.calls.find(([url]) => url.endsWith('/api/auth/sign-out'));
  expect(header(signOutCall[1], 'authorization')).toBe('Bearer token-1');
  expect(sessions.size).toBe(0);
  expectPurged(context);
  expect(context.onSignedOut).toHaveBeenCalledTimes(1);
});

test('a 401 to a call that carried the token removes the person and asks for sign-in again', async () => {
  const { server, sessions } = createServer();
  const context = await setup({ server });
  await signIn(context);
  keepPersonData(context.kv);
  sessions.clear();
  const res = await context.auth.fetch(`${apiBase}/api/request/today/get_jobs`, {
    method: 'POST',
    headers: { Authorization: 'Bearer token-1' },
  });
  expect(res.status).toBe(401);
  await until(() => context.onSignedOut.mock.calls.length === 1);
  expectPurged(context);
  // The session was already gone: the shell does not call sign-out.
  expect(server.fetch.mock.calls.some(([url]) => url.endsWith('/api/auth/sign-out'))).toBe(false);
});

test('an answer as the signed-out caller to a call with the token ends the session', async () => {
  const { server, sessions } = createServer();
  const context = await setup({ server });
  await signIn(context);
  keepPersonData(context.kv);
  sessions.clear();
  await context.session.sync().catch(() => {});
  await until(() => context.onSignedOut.mock.calls.length === 1);
  expectPurged(context);
});

test('the token cleared by the core (a Logout action) is a sign-out too', async () => {
  const context = await setup();
  await signIn(context);
  keepPersonData(context.kv);
  await context.auth.tokenStore.clear();
  await until(() => context.onSignedOut.mock.calls.length === 1);
  expectPurged(context);
});

test('a 403 drops the cache of the organisation that refused the person, and only that', async () => {
  const context = await setup();
  await signIn(context);
  expect(context.cacheStore.roots.has('field:c-ana:r1')).toBe(true);
  expect(context.cacheStore.roots.has('field::')).toBe(true);
  await context.auth.fetch(`${apiBase}/api/endpoints/admin`, {
    method: 'POST',
    headers: { Authorization: 'Bearer token-1' },
  });
  await until(() => !context.cacheStore.roots.has('field:c-ana:r1'));
  expect(context.cacheStore.roots.has('field::')).toBe(true);
  expect(context.onSignedOut).not.toHaveBeenCalled();
});

test('with biometric unlock the app locks after unlockAfter seconds in the background', async () => {
  const { server } = createServer({ auth: { ...settings, unlock: 'biometric', unlockAfter: 60 } });
  const context = await setup({ server });
  await signIn(context);
  expect(context.auth.tokenStore.isProtected()).toBe(true);

  context.appState.emit('background');
  context.clock.now = 59_999;
  context.appState.emit('active');
  expect(context.view()).toBe('app');

  context.appState.emit('background');
  context.clock.now += 60_000;
  context.appState.emit('active');
  expect(context.view()).toBe('lock');
  // The protected token leaves memory; reading it again is the unlock prompt.
  expect(context.auth.tokenStore.get()).toBeNull();
  expect(context.onSignedOut).not.toHaveBeenCalled();

  SecureStore.getItemAsync.mockClear();
  expect(await context.auth.unlock()).toBe(true);
  expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
    'lowdefy-session-token.field',
    expect.objectContaining({ requireAuthentication: true })
  );
  expect(context.auth.tokenStore.get()).toBe('token-1');
  expect(context.view()).toBe('app');
});

test('a cancelled unlock prompt keeps the app locked', async () => {
  const { server } = createServer({ auth: { ...settings, unlock: 'biometric', unlockAfter: 0 } });
  const context = await setup({ server });
  await signIn(context);
  context.appState.emit('background');
  context.appState.emit('active');
  SecureStore.getItemAsync.mockRejectedValueOnce(new Error('User canceled the authentication'));
  expect(await context.auth.unlock()).toBe(false);
  expect(context.view()).toBe('lock');
});

test('an app opened with a protected token shows the lock screen before reading it', async () => {
  const kv = createMemoryStore();
  const cacheStore = createMemoryCacheStore();
  const { server } = createServer({ auth: { ...settings, unlock: 'biometric' } });
  const first = await setup({ cacheStore, kv, server });
  await signIn(first);
  first.auth.dispose();

  SecureStore.getItemAsync.mockClear();
  const context = await setup({ cacheStore, kv, server });
  expect(context.view()).toBe('lock');
  expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
  expect(context.session.getState().status).toBe('loading');
  expect(await context.auth.unlock()).toBe(true);
  await until(() => context.session.getState().cacheKey === 'field:c-ana:r1');
  expect(context.view()).toBe('app');
});

test('a shell with background work locks with the device biometrics and keeps its token', async () => {
  const { server } = createServer({ auth: { ...settings, unlock: 'biometric', unlockAfter: 0 } });
  const context = await setup({ server, shell: trackingShell });
  await signIn(context);
  expect(context.auth.tokenStore.isProtected()).toBe(false);
  context.appState.emit('background');
  context.appState.emit('active');
  expect(context.view()).toBe('lock');
  expect(context.auth.tokenStore.get()).toBe('token-1');
  context.localAuthentication.authenticateAsync.mockResolvedValueOnce({ success: false });
  expect(await context.auth.unlock()).toBe(false);
  expect(context.view()).toBe('lock');
  expect(await context.auth.unlock()).toBe(true);
  expect(context.localAuthentication.authenticateAsync).toHaveBeenLastCalledWith({
    promptMessage: 'Unlock Field',
  });
  expect(context.view()).toBe('app');
});

test('a shared device signs out when the app closes, and skips biometrics', async () => {
  const { server } = createServer({
    auth: { ...settings, unlock: 'biometric', unlockAfter: 0, sharedDevice: true },
  });
  const context = await setup({ server });
  await signIn(context);
  expect(context.auth.tokenStore.isProtected()).toBe(false);
  keepPersonData(context.kv);
  context.appState.emit('background');
  await until(() => context.onSignedOut.mock.calls.length === 1);
  expectPurged(context);
});

test('a shared device signs out on start when its token was stored behind biometrics', async () => {
  const kv = createMemoryStore();
  const first = await setup({
    kv,
    server: createServer({ auth: { ...settings, unlock: 'biometric' } }).server,
  });
  await signIn(first);
  expect(first.auth.tokenStore.isProtected()).toBe(true);
  first.auth.dispose();
  // The app became a shared device, and the shell kept the new settings, before it was killed.
  const shared = { ...settings, unlock: 'biometric', sharedDevice: true };
  kv.set('lowdefy-shell:auth:field', JSON.stringify({ settings: shared, slug: 'field' }));
  const context = await setup({
    kv,
    server: createServer({ auth: shared }).server,
  });
  expect(context.onSignedOut).toHaveBeenCalledTimes(1);
  expect(context.localAuthentication.authenticateAsync).not.toHaveBeenCalled();
  expect(SecureStore.items.size).toBe(0);
});

test('a shared device signs out on start when the app was closed without going to the background', async () => {
  const kv = createMemoryStore();
  const { server } = createServer({ auth: { ...settings, sharedDevice: true } });
  const first = await setup({ kv, server });
  await signIn(first);
  first.auth.dispose();
  const context = await setup({ kv, server });
  expect(context.onSignedOut).toHaveBeenCalledTimes(1);
  expect(SecureStore.items.size).toBe(0);
});
