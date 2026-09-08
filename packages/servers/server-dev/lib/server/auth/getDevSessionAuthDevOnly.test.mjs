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

// An app whose only auth key is auth.dev declares no auth stack, so the build
// writes configured: false — and its mock user must still be the dev caller.
// The mock is per module registry, hence a file of its own.
jest.unstable_mockModule('../../build/auth.js', () => ({
  default: {
    configured: false,
    callbacks: [],
    dev: { mockUser: { id: 'dev-only', sub: 'dev-only', roles: ['admin'] } },
  },
}));

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

const originalDevUser = process.env.LOWDEFY_DEV_USER;

beforeEach(() => {
  delete process.env.LOWDEFY_DEV_USER;
});

afterAll(() => {
  if (originalDevUser === undefined) {
    delete process.env.LOWDEFY_DEV_USER;
  } else {
    process.env.LOWDEFY_DEV_USER = originalDevUser;
  }
});

function createContext() {
  return { req: { header: () => undefined } };
}

test('auth.dev.mockUser is the dev caller even though the app declares no auth stack', async () => {
  const session = await getDevSession(createContext());
  expect(session.user.id).toEqual('dev-only');
  expect(typeof session.hashed_id).toBe('string');
});
