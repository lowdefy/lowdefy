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
import { jest } from '@jest/globals';

// The peers may be installed in this workspace, so stand in for an app without them:
// the bare import fails as Node would report it, and the fallback resolution from the
// app directory (an empty temp dir) finds nothing either.
jest.unstable_mockModule('mongodb-memory-server', () => {
  throw Object.assign(new Error("Cannot find package 'mongodb-memory-server'"), {
    code: 'ERR_MODULE_NOT_FOUND',
  });
});
jest.unstable_mockModule('mongodb', () => {
  throw Object.assign(new Error("Cannot find package 'mongodb'"), {
    code: 'ERR_MODULE_NOT_FOUND',
  });
});

const { default: loadMemoryMongo, INSTALL_HINT } = await import('./loadMemoryMongo.js');

test('loadMemoryMongo throws the install hint when the optional peers are not installed', async () => {
  const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-no-mongo-'));
  try {
    await expect(loadMemoryMongo({ configDirectory })).rejects.toThrow(INSTALL_HINT);
  } finally {
    fs.rmSync(configDirectory, { recursive: true, force: true });
  }
});

test('loadMemoryMongo install hint names both packages', () => {
  expect(INSTALL_HINT).toEqual(
    'Request tests with "seed" need an in-memory MongoDB. Install it: pnpm add -D mongodb-memory-server mongodb'
  );
});
