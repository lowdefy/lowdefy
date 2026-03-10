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
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

jest.unstable_mockModule('./fetchGitHubModule.js', () => ({
  default: jest.fn(),
}));

let fetchModules;
let fetchGitHubModule;

beforeEach(async () => {
  jest.clearAllMocks();
  const mod = await import('./fetchModules.js');
  fetchModules = mod.default;
  const ghMod = await import('./fetchGitHubModule.js');
  fetchGitHubModule = ghMod.default;
});

test('fetchModules returns empty object for empty moduleEntries', async () => {
  const result = await fetchModules({
    moduleEntries: [],
    context: { directories: { config: '/app' } },
  });
  expect(result).toEqual({});
});

test('fetchModules resolves file source with existing module.yaml', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  fs.writeFileSync(path.join(tmpDir, 'module.yaml'), 'id: test');

  const result = await fetchModules({
    moduleEntries: [{ id: 'my-module', source: `file:${tmpDir}` }],
    context: { directories: { config: '/' } },
  });

  expect(result).toEqual({
    'my-module': {
      packageRoot: tmpDir,
      moduleRoot: tmpDir,
      isLocal: true,
    },
  });

  fs.rmSync(tmpDir, { recursive: true });
});

test('fetchModules throws for file source when module.yaml does not exist', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));

  await expect(
    fetchModules({
      moduleEntries: [{ id: 'my-module', source: `file:${tmpDir}` }],
      context: { directories: { config: '/' } },
    })
  ).rejects.toThrow(`Module "my-module": module.yaml not found at ${tmpDir}`);

  fs.rmSync(tmpDir, { recursive: true });
});

test('fetchModules resolves github source without path', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  fs.writeFileSync(path.join(tmpDir, 'module.yaml'), 'id: test');
  fetchGitHubModule.mockResolvedValue({ packageRoot: tmpDir });

  const result = await fetchModules({
    moduleEntries: [{ id: 'notifications', source: 'github:lowdefy/notifications@v1.0.0' }],
    context: { directories: { config: '/app' } },
  });

  expect(result).toEqual({
    notifications: {
      packageRoot: tmpDir,
      moduleRoot: tmpDir,
      isLocal: false,
    },
  });
  expect(fetchGitHubModule).toHaveBeenCalledWith(
    { type: 'github', owner: 'lowdefy', repo: 'notifications', path: null, ref: 'v1.0.0' },
    { directories: { config: '/app' } }
  );

  fs.rmSync(tmpDir, { recursive: true });
});

test('fetchModules resolves github source with subdirectory path', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  const moduleDir = path.join(tmpDir, 'user-admin');
  fs.mkdirSync(moduleDir, { recursive: true });
  fs.writeFileSync(path.join(moduleDir, 'module.yaml'), 'id: test');
  fetchGitHubModule.mockResolvedValue({ packageRoot: tmpDir });

  const result = await fetchModules({
    moduleEntries: [{ id: 'users', source: 'github:my-org/modules/user-admin@v1.0.0' }],
    context: { directories: { config: '/app' } },
  });

  expect(result).toEqual({
    users: {
      packageRoot: tmpDir,
      moduleRoot: moduleDir,
      isLocal: false,
    },
  });

  fs.rmSync(tmpDir, { recursive: true });
});

test('fetchModules throws for github source when module.yaml not found at path', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  fetchGitHubModule.mockResolvedValue({ packageRoot: tmpDir });

  await expect(
    fetchModules({
      moduleEntries: [{ id: 'users', source: 'github:my-org/modules/user-admin@v1.0.0' }],
      context: { directories: { config: '/app' } },
    })
  ).rejects.toThrow(
    'Module "users": module.yaml not found at path "user-admin" in my-org/modules@v1.0.0'
  );

  fs.rmSync(tmpDir, { recursive: true });
});

test('fetchModules resolves multiple entries', async () => {
  const tmpDir1 = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  fs.writeFileSync(path.join(tmpDir1, 'module.yaml'), 'id: local');

  const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-'));
  fs.writeFileSync(path.join(tmpDir2, 'module.yaml'), 'id: remote');
  fetchGitHubModule.mockResolvedValue({ packageRoot: tmpDir2 });

  const result = await fetchModules({
    moduleEntries: [
      { id: 'local-mod', source: `file:${tmpDir1}` },
      { id: 'remote-mod', source: 'github:org/repo@v1.0.0' },
    ],
    context: { directories: { config: '/' } },
  });

  expect(result).toEqual({
    'local-mod': {
      packageRoot: tmpDir1,
      moduleRoot: tmpDir1,
      isLocal: true,
    },
    'remote-mod': {
      packageRoot: tmpDir2,
      moduleRoot: tmpDir2,
      isLocal: false,
    },
  });

  fs.rmSync(tmpDir1, { recursive: true });
  fs.rmSync(tmpDir2, { recursive: true });
});
