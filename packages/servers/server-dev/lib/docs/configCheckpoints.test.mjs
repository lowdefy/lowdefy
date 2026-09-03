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

import { MAX_CHECKPOINTS } from './checkpointPaths.js';
import createConfigCheckpoint from './createConfigCheckpoint.js';
import listConfigCheckpoints from './listConfigCheckpoints.js';
import revertConfigCheckpoint from './revertConfigCheckpoint.js';
import { listMocks, loadMocks } from './devMockRegistry.js';

let configDirectory;
let previousConfigDirectory;
let previousCwd;

function writeFile(relativePath, content) {
  const filePath = path.join(configDirectory, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(configDirectory, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(configDirectory, relativePath));
}

// Checkpoint ids are timestamp-prefixed (see createConfigCheckpoint.js), so
// tests asserting ordering/eviction need genuinely distinct timestamps
// between calls. A real (short) delay is used instead of mocking the clock —
// this Node/Jest combination's fake timers cannot redefine `performance`.
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-config-checkpoints-test-'));
  previousConfigDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG;
  process.env.LOWDEFY_DIRECTORY_CONFIG = configDirectory;
  previousCwd = process.cwd();
  process.chdir(configDirectory);

  writeFile('lowdefy.yaml', 'name: my-app\n');
  writeFile(path.join('pages', 'home.yaml'), 'id: home\n');
  writeFile('.env', 'SECRET=abc\n');
  writeFile('README.md', '# My App\n');
  // Should never be snapshotted.
  writeFile(path.join('node_modules', 'some-dep', 'index.js'), 'module.exports = {};\n');
  writeFile(path.join('.git', 'HEAD'), 'ref: refs/heads/main\n');
});

afterEach(() => {
  process.chdir(previousCwd);
  fs.rmSync(configDirectory, { recursive: true, force: true });
  if (previousConfigDirectory === undefined) {
    delete process.env.LOWDEFY_DIRECTORY_CONFIG;
  } else {
    process.env.LOWDEFY_DIRECTORY_CONFIG = previousConfigDirectory;
  }
});

test('createConfigCheckpoint snapshots config-relevant files and excludes build/vcs/dependency directories', () => {
  const result = createConfigCheckpoint({ label: 'before change' });

  expect(result.fileCount).toBe(4);
  expect(result.id).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-before-change$/);

  const snapshotDirectory = path.join(configDirectory, '.lowdefy', 'checkpoints', result.id);
  const manifest = JSON.parse(
    fs.readFileSync(path.join(snapshotDirectory, 'manifest.json'), 'utf8')
  );
  expect(manifest.files.sort()).toEqual(
    ['lowdefy.yaml', path.join('pages', 'home.yaml'), '.env', 'README.md'].sort()
  );

  expect(fs.readFileSync(path.join(snapshotDirectory, 'lowdefy.yaml'), 'utf8')).toBe(
    'name: my-app\n'
  );
  expect(fs.existsSync(path.join(snapshotDirectory, 'node_modules'))).toBe(false);
  expect(fs.existsSync(path.join(snapshotDirectory, '.git'))).toBe(false);
});

test('listConfigCheckpoints returns an empty array when no checkpoints exist', () => {
  expect(listConfigCheckpoints()).toEqual([]);
});

test('listConfigCheckpoints lists checkpoints most recent first', async () => {
  const first = createConfigCheckpoint({ label: 'first' });
  await sleep(5);
  const second = createConfigCheckpoint({ label: 'second' });

  const checkpoints = listConfigCheckpoints();
  expect(checkpoints).toEqual([
    { id: second.id, label: 'second', createdAt: expect.any(String), fileCount: 4 },
    { id: first.id, label: 'first', createdAt: expect.any(String), fileCount: 4 },
  ]);
});

test('revertConfigCheckpoint restores modified and deleted files, and deletes files added since the checkpoint', () => {
  const { id } = createConfigCheckpoint({ label: 'snapshot' });

  // Modify an existing file.
  writeFile('lowdefy.yaml', 'name: modified-app\n');
  // Delete a file that was in the checkpoint.
  fs.rmSync(path.join(configDirectory, 'pages', 'home.yaml'));
  // Add a new config-relevant file that was not in the checkpoint.
  writeFile(path.join('pages', 'extra.yaml'), 'id: extra\n');

  const result = revertConfigCheckpoint({ id });

  expect(readFile('lowdefy.yaml')).toBe('name: my-app\n');
  expect(exists(path.join('pages', 'home.yaml'))).toBe(true);
  expect(readFile(path.join('pages', 'home.yaml'))).toBe('id: home\n');
  expect(exists(path.join('pages', 'extra.yaml'))).toBe(false);

  expect(result.restored.sort()).toEqual(
    ['lowdefy.yaml', path.join('pages', 'home.yaml'), '.env', 'README.md'].sort()
  );
  expect(result.deleted).toEqual([path.join('pages', 'extra.yaml')]);
});

test('revertConfigCheckpoint throws an actionable error when the checkpoint id does not exist', () => {
  expect(() => revertConfigCheckpoint({ id: 'does-not-exist' })).toThrow(
    'Config checkpoint "does-not-exist" not found.'
  );
});

test('createConfigCheckpoint evicts the oldest checkpoint once more than the cap are stored', async () => {
  for (let i = 0; i < MAX_CHECKPOINTS + 1; i += 1) {
    createConfigCheckpoint({ label: `checkpoint-${i}` });
    await sleep(2);
  }

  const checkpoints = listConfigCheckpoints();
  expect(checkpoints).toHaveLength(MAX_CHECKPOINTS);
  expect(checkpoints.some((checkpoint) => checkpoint.label === 'checkpoint-0')).toBe(false);
  expect(
    checkpoints.some((checkpoint) => checkpoint.label === `checkpoint-${MAX_CHECKPOINTS}`)
  ).toBe(true);
});

// Recorded responses were captured against the config as it was before the
// revert, so a revert must not leave the app replaying them.
test('revertConfigCheckpoint clears the replayed request mocks', () => {
  const { id } = createConfigCheckpoint({ label: 'before-mocks' });
  loadMocks({ pageId: 'home', checkpoint: 'cp-revert', mocks: { req1: { response: { ok: 1 } } } });
  expect(listMocks()).toHaveLength(1);

  revertConfigCheckpoint({ id });

  expect(listMocks()).toEqual([]);
});
