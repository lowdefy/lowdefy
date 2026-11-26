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
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import readBuildArtifact from './readBuildArtifact.js';

let serverDirectory;

function write(name, value) {
  const filePath = path.join(serverDirectory, 'build', name);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value));
}

beforeEach(() => {
  serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'read-build-artifact-'));
  vi.spyOn(process, 'cwd').mockReturnValue(serverDirectory);
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(serverDirectory, { recursive: true, force: true });
});

test('readBuildArtifact returns a page the dev build rewrote, not the one it read before', () => {
  write('pages/home.json', { title: 'one' });
  expect(readBuildArtifact({ name: 'pages/home.json' }).title).toEqual('one');
  write('pages/home.json', { title: 'two' });
  expect(readBuildArtifact({ name: 'pages/home.json' }).title).toEqual('two');
});

test('readBuildArtifact returns a page built on demand after a read found none', () => {
  expect(readBuildArtifact({ name: 'pages/late.json', deserialize: true })).toBe(null);
  write('pages/late.json', { pageId: 'late' });
  expect(readBuildArtifact({ name: 'pages/late.json', deserialize: true }).pageId).toEqual('late');
});

test('readBuildArtifact keeps the raw and the deserialized form apart', () => {
  write('routes.json', { '~arr': [{ pageId: 'home' }] });
  expect(readBuildArtifact({ name: 'routes.json' })).toEqual({ '~arr': [{ pageId: 'home' }] });
  expect(readBuildArtifact({ name: 'routes.json', deserialize: true })).toEqual([
    { pageId: 'home' },
  ]);
});

test('readBuildArtifact reads the build of the working directory it is called from', () => {
  write('app.json', { name: 'first' });
  expect(readBuildArtifact({ name: 'app.json' }).name).toEqual('first');
  const other = fs.mkdtempSync(path.join(os.tmpdir(), 'read-build-artifact-'));
  try {
    fs.mkdirSync(path.join(other, 'build'));
    fs.writeFileSync(path.join(other, 'build', 'app.json'), JSON.stringify({ name: 'second' }));
    process.cwd.mockReturnValue(other);
    expect(readBuildArtifact({ name: 'app.json' }).name).toEqual('second');
  } finally {
    fs.rmSync(other, { recursive: true, force: true });
  }
});
