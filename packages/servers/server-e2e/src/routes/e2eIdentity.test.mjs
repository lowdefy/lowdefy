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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Hono } from 'hono';
import { jest } from '@jest/globals';

test('GET /api/e2e/identity names the e2e server and the real path of its build directory', async () => {
  const serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-e2e-identity-'));
  fs.mkdirSync(path.join(serverDirectory, 'build'));
  const linkedServerDirectory = `${serverDirectory}-link`;
  fs.symlinkSync(serverDirectory, linkedServerDirectory, 'junction');
  jest.spyOn(process, 'cwd').mockReturnValue(linkedServerDirectory);

  const { default: e2eIdentityHandler } = await import('./e2eIdentity.js');
  const app = new Hono();
  app.get('/api/e2e/identity', e2eIdentityHandler);
  const res = await app.request('/api/e2e/identity');

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({
    server: 'lowdefy-e2e',
    buildDirectory: fs.realpathSync(path.join(serverDirectory, 'build')),
  });
  fs.rmSync(linkedServerDirectory);
  fs.rmSync(serverDirectory, { recursive: true });
});
