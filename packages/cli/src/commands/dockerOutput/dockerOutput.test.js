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

import { vi, afterEach, beforeEach, expect, test } from 'vitest';

// Tracing the server's dependency closure is @vercel/nft's job and needs a real install; the
// assembly around it is what these tests cover.
vi.doMock('../../utils/copyTracedFiles.js', () => ({
  default: vi.fn(async () => 0),
}));

let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-docker-output-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function writeFiles({ directory, files }) {
  Object.entries(files).forEach(([file, content]) => {
    fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
    fs.writeFileSync(path.join(directory, file), content);
  });
}

function listFiles(directory) {
  return fs
    .readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(directory, path.join(entry.parentPath, entry.name)).split(path.sep).join('/')
    )
    .sort();
}

async function runDockerOutput({ buildFiles }) {
  const { default: dockerOutput } = await import('./dockerOutput.js');
  const configDirectory = path.join(root, 'app');
  const serverDirectory = path.join(root, 'server');
  writeFiles({
    directory: serverDirectory,
    files: {
      'src/index.js': '',
      'src/app.js': '',
      'lib/build/config.js': '',
      'package.json': '{}',
      'dist/client/index.html': '<html />',
      ...Object.fromEntries(
        Object.entries(buildFiles).map(([file, content]) => [`build/${file}`, content])
      ),
    },
  });
  await dockerOutput({
    context: {
      directories: {
        build: path.join(serverDirectory, 'build'),
        config: configDirectory,
        server: serverDirectory,
      },
      logger: { info: vi.fn(), debug: vi.fn() },
      sendTelemetry: vi.fn(),
    },
  });
  // The trace base is the server directory itself: it sits in no pnpm workspace.
  return path.join(configDirectory, '.lowdefy', 'docker');
}

test('dockerOutput ships the gzipped error maps and leaves the plain maps out', async () => {
  const outputDirectory = await runDockerOutput({
    buildFiles: {
      'config.json': '{}',
      'keyMap.json': '{"1":{"s":"root"}}',
      'keyMap.json.gz': 'gzipped key map',
      'refMap.json': '{"1":{"path":"lowdefy.yaml"}}',
      'refMap.json.gz': 'gzipped ref map',
      'pages/home/keyMap.json': 'not the root key map',
    },
  });
  expect(listFiles(path.join(outputDirectory, 'build'))).toEqual([
    'config.json',
    'keyMap.json.gz',
    'pages/home/keyMap.json',
    'refMap.json.gz',
  ]);
  expect(fs.existsSync(path.join(outputDirectory, 'dist/client/index.html'))).toBe(true);
  expect(fs.existsSync(path.join(outputDirectory, 'start.mjs'))).toBe(true);
  // The trace takes the same filter: nft traces the whole build folder.
  const { default: copyTracedFiles } = await import('../../utils/copyTracedFiles.js');
  const { filter } = copyTracedFiles.mock.calls.at(-1)[0];
  const buildDirectory = path.join(root, 'server', 'build');
  expect(filter(path.join(buildDirectory, 'keyMap.json'))).toBe(false);
  expect(filter(path.join(buildDirectory, 'refMap.json'))).toBe(false);
  expect(filter(path.join(buildDirectory, 'refMap.json.gz'))).toBe(true);
});

test('dockerOutput copies a build directory that has no plain maps', async () => {
  const outputDirectory = await runDockerOutput({
    buildFiles: { 'config.json': '{}', 'pages/home.json': '{}' },
  });
  expect(listFiles(path.join(outputDirectory, 'build'))).toEqual([
    'config.json',
    'pages/home.json',
  ]);
});
