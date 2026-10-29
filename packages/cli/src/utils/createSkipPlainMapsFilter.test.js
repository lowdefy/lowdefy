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

import { afterEach, beforeEach, expect, test } from 'vitest';
import { copyFileOrDirectory } from '@lowdefy/node-utils';

import createSkipPlainMapsFilter from './createSkipPlainMapsFilter.js';

let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-skip-plain-maps-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function writeFiles({ directory, files }) {
  files.forEach((file) => {
    fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
    fs.writeFileSync(path.join(directory, file), file);
  });
}

function listFiles(directory) {
  return fs
    .readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(directory, path.join(entry.parentPath, entry.name)))
    .sort();
}

test('createSkipPlainMapsFilter skips only the plain maps at the build directory root', () => {
  const buildDirectory = path.join(root, 'build');
  const skipPlainMaps = createSkipPlainMapsFilter({ buildDirectory });
  expect(skipPlainMaps(buildDirectory)).toBe(true);
  expect(skipPlainMaps(path.join(buildDirectory, 'keyMap.json'))).toBe(false);
  expect(skipPlainMaps(path.join(buildDirectory, 'refMap.json'))).toBe(false);
  expect(skipPlainMaps(path.join(buildDirectory, 'keyMap.json.gz'))).toBe(true);
  expect(skipPlainMaps(path.join(buildDirectory, 'refMap.json.gz'))).toBe(true);
  expect(skipPlainMaps(path.join(buildDirectory, 'pages', 'x', 'keyMap.json'))).toBe(true);
  expect(skipPlainMaps(path.join(buildDirectory, 'jitMaps', 'refMap.json'))).toBe(true);
});

test('createSkipPlainMapsFilter matches a build directory given as a relative path', () => {
  const buildDirectory = path.relative(process.cwd(), path.join(root, 'build'));
  const skipPlainMaps = createSkipPlainMapsFilter({ buildDirectory });
  expect(skipPlainMaps(path.join(root, 'build', 'keyMap.json'))).toBe(false);
});

test('copying with createSkipPlainMapsFilter leaves out the root plain maps and keeps everything else', async () => {
  const buildDirectory = path.join(root, 'build');
  writeFiles({
    directory: buildDirectory,
    files: [
      'config.json',
      'keyMap.json',
      'keyMap.json.gz',
      'refMap.json',
      'refMap.json.gz',
      'pages/x/keyMap.json',
      'jitMaps/refMap.json',
    ],
  });
  const outputDirectory = path.join(root, 'output');
  await copyFileOrDirectory(buildDirectory, outputDirectory, {
    filter: createSkipPlainMapsFilter({ buildDirectory }),
  });
  expect(listFiles(outputDirectory)).toEqual(
    [
      'config.json',
      'jitMaps/refMap.json',
      'keyMap.json.gz',
      'pages/x/keyMap.json',
      'refMap.json.gz',
    ].map((file) => file.split('/').join(path.sep))
  );
});

test('copying with createSkipPlainMapsFilter copies a build directory with no plain maps', async () => {
  const buildDirectory = path.join(root, 'build');
  writeFiles({ directory: buildDirectory, files: ['config.json', 'pages/home.json'] });
  const outputDirectory = path.join(root, 'output');
  await copyFileOrDirectory(buildDirectory, outputDirectory, {
    filter: createSkipPlainMapsFilter({ buildDirectory }),
  });
  expect(listFiles(outputDirectory)).toEqual(
    ['config.json', 'pages/home.json'].map((file) => file.split('/').join(path.sep))
  );
});
