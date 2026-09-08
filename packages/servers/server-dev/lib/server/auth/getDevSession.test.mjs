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
import path from 'path';
import { fileURLToPath } from 'url';

import { jest } from '@jest/globals';

// Only the auth build artifact is mocked — createSessionCallback is the REAL
// @lowdefy/api pipeline, because prod parity is exactly what these tests
// exist to prove: a dev session must be shaped by the same userFields
// mapping, roles validation, and hashed_id stamping as a real sign-in.
jest.unstable_mockModule('../../build/auth.js', () => ({
  default: {
    configured: true,
    callbacks: [],
    userFields: {
      id: 'user.id',
      roles: 'user.roles',
      global_attributes: 'user.global_attributes',
    },
  },
}));

// getDevSession statically imports the app build's auth callbacks module,
// which only exists in a built app (build/** is gitignored). Materialize an
// empty one — exactly what a build without custom auth callback plugins
// writes — so the import resolves; clean up only if this test created it.
const dirname = path.dirname(fileURLToPath(import.meta.url));
const callbacksDir = path.resolve(dirname, '../../../build/plugins/auth');
const callbacksPath = path.join(callbacksDir, 'callbacks.js');
const createdCallbacksFixture = !fs.existsSync(callbacksPath);
if (createdCallbacksFixture) {
  fs.mkdirSync(callbacksDir, { recursive: true });
  fs.writeFileSync(callbacksPath, 'export default {};\n');
}

afterAll(() => {
  if (createdCallbacksFixture) {
    fs.rmSync(callbacksPath, { force: true });
  }
});

const { default: getDevSession } = await import('./getDevSession.js');
const { HEADLESS_USER_COOKIE, headlessUser } = await import('./headlessUser.js');

function createContext({ cookie } = {}) {
  return { req: { header: (name) => (name === 'cookie' ? (cookie ?? '') : undefined) } };
}

function headlessCookie(user = headlessUser) {
  return `${HEADLESS_USER_COOKIE}=${Buffer.from(JSON.stringify(user)).toString('base64')}`;
}

const originalDevUser = process.env.LOWDEFY_DEV_USER;

afterEach(() => {
  if (originalDevUser === undefined) {
    delete process.env.LOWDEFY_DEV_USER;
  } else {
    process.env.LOWDEFY_DEV_USER = originalDevUser;
  }
});

test('getDevSession returns undefined with no mock user and no headless cookie', async () => {
  delete process.env.LOWDEFY_DEV_USER;
  expect(await getDevSession(createContext())).toBe(undefined);
});

test('mock user session is built by the real session callback — userFields, hashed_id, expires', async () => {
  // The claim shape a consuming app's tenant convention uses (e.g.
  // global_attributes.company_ids) must survive to session.user on BOTH the
  // server request path and the client session endpoint — this session is
  // what both serve.
  process.env.LOWDEFY_DEV_USER = JSON.stringify({
    id: 'dev-user',
    sub: 'dev-user',
    name: 'Dev User',
    roles: ['admin'],
    global_attributes: { company_ids: ['C-1'] },
  });

  const session = await getDevSession(createContext());
  expect(session.user.id).toEqual('dev-user');
  expect(session.user.name).toEqual('Dev User');
  expect(session.user.roles).toEqual(['admin']);
  expect(session.user.global_attributes).toEqual({ company_ids: ['C-1'] });
  // Prod-session markers from the real pipeline:
  expect(typeof session.hashed_id).toBe('string');
  expect(session.hashed_id.length).toBeGreaterThan(0);
  expect(new Date(session.expires).getTime()).toBeGreaterThan(Date.now());
});

test('headless cookie session runs through the same pipeline as a real sign-in', async () => {
  delete process.env.LOWDEFY_DEV_USER;

  const session = await getDevSession(createContext({ cookie: headlessCookie() }));
  expect(session.user.id).toEqual(headlessUser.id);
  expect(session.user.roles).toEqual([]);
  expect(typeof session.hashed_id).toBe('string');
});

test('mock user takes precedence over the headless cookie', async () => {
  process.env.LOWDEFY_DEV_USER = JSON.stringify({ id: 'mock-wins', roles: [] });

  const session = await getDevSession(createContext({ cookie: headlessCookie() }));
  expect(session.user.id).toEqual('mock-wins');
});

test('invalid roles are rejected by the real pipeline, exactly as in prod', async () => {
  process.env.LOWDEFY_DEV_USER = JSON.stringify({ id: 'bad', roles: 'admin' });

  await expect(getDevSession(createContext())).rejects.toThrow(
    'session.user.roles must be an array of strings.'
  );
});

test('invalid JSON in LOWDEFY_DEV_USER throws a clear error', async () => {
  process.env.LOWDEFY_DEV_USER = 'not json';

  await expect(getDevSession(createContext())).rejects.toThrow(
    'Invalid JSON in LOWDEFY_DEV_USER environment variable.'
  );
});
