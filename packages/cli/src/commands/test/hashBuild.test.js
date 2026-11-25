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

import hashBuild from './hashBuild.js';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

let configDirectory;
let context;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-hash-build-'));
  context = {
    directories: {
      dev: path.join(configDirectory, 'dev'),
      build: path.join(configDirectory, 'build'),
    },
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

const build = () => path.join(context.directories.dev, 'build');

function writeBuild({ page = { id: 'page:a', title: 'A' }, buildId = 'one', marker = 1 }) {
  fs.mkdirSync(path.join(build(), 'plugins'), { recursive: true });
  fs.mkdirSync(path.join(build(), 'pages'), { recursive: true });
  fs.writeFileSync(path.join(build(), 'plugins', 'blockMetas.json'), '{}');
  fs.writeFileSync(path.join(build(), 'keyMap.json'), '{}');
  fs.writeFileSync(path.join(build(), 'refMap.json'), '{}');
  fs.writeFileSync(path.join(build(), 'appMeta.json'), JSON.stringify({ buildId }));
  fs.writeFileSync(
    path.join(build(), 'pages', 'a.json'),
    JSON.stringify({ ...page, '~k': marker })
  );
}

test('the hash ignores the buildId and the location markers of a rebuild', () => {
  writeBuild({ buildId: '2026-10-16T10:38:38.479Z', marker: 1 });
  const first = hashBuild({ context });
  writeBuild({ buildId: '2026-10-16T10:59:01.002Z', marker: 7 });
  expect(first).toMatch(/^[0-9a-f]{40}$/);
  expect(hashBuild({ context })).toEqual(first);
});

test('the hash changes when the config does', () => {
  writeBuild({});
  const first = hashBuild({ context });
  writeBuild({ page: { id: 'page:a', title: 'B' } });
  expect(hashBuild({ context })).not.toEqual(first);
});

test('the hash is null when there is no build to read', () => {
  expect(hashBuild({ context })).toBeNull();
});

// A context whose runs keep artifact hashes in .lowdefy/test, as the CLI's does.
function withTestDirectory() {
  context.directories.test = path.join(configDirectory, 'test');
}

// The build files hashBuild read since the spy was set, by path inside the build.
function readSpy() {
  const spy = vi.spyOn(fs, 'readFileSync');
  return () =>
    spy.mock.calls
      .map(([filePath]) => String(filePath))
      .filter((filePath) => filePath.startsWith(build()))
      .map((filePath) => path.relative(build(), filePath).split(path.sep).join('/'))
      .sort();
}

function writeArtifact(file, value) {
  fs.mkdirSync(path.dirname(path.join(build(), file)), { recursive: true });
  fs.writeFileSync(path.join(build(), file), JSON.stringify(value));
}

test('the hash reads only the artifacts it hashes, never keyMap.json or refMap.json', () => {
  writeBuild({});
  writeArtifact('pages/a/requests/r.json', { id: 'r' });
  writeArtifact('api/e.json', { id: 'e' });
  const read = readSpy();
  hashBuild({ context });
  expect(read()).toEqual(['api/e.json', 'pages/a.json', 'pages/a/requests/r.json']);
});

test('a second hash reads no artifact the build has not written since, and gives the same hash', () => {
  withTestDirectory();
  writeBuild({});
  writeArtifact('api/e.json', { id: 'e' });
  const first = hashBuild({ context });
  expect(fs.existsSync(path.join(context.directories.test, 'build-hashes.json'))).toBe(true);
  const read = readSpy();
  expect(hashBuild({ context })).toEqual(first);
  expect(read()).toEqual([]);
});

test('a hash rereads only the artifacts written since, and moves with their content', () => {
  withTestDirectory();
  writeBuild({});
  writeArtifact('api/e.json', { id: 'e' });
  const first = hashBuild({ context });
  // A page the run built on demand.
  writeArtifact('pages/b.json', { id: 'page:b' });
  let read = readSpy();
  const second = hashBuild({ context });
  expect(read()).toEqual(['pages/b.json']);
  expect(second).not.toEqual(first);
  vi.restoreAllMocks();
  // An artifact written again with other content.
  writeArtifact('api/e.json', { id: 'e', type: 'changed' });
  read = readSpy();
  const third = hashBuild({ context });
  expect(read()).toEqual(['api/e.json']);
  expect(third).not.toEqual(second);
  // The same content written again, under a new modified time, hashes as before.
  writeArtifact('api/e.json', { id: 'e' });
  expect(hashBuild({ context })).toEqual(second);
  // A removed artifact moves the hash too.
  fs.rmSync(path.join(build(), 'pages', 'b.json'));
  expect(hashBuild({ context })).toEqual(first);
});

test('the cached hash is the hash of a build read in full', () => {
  withTestDirectory();
  writeBuild({});
  writeArtifact('connections/c.json', { id: 'c' });
  hashBuild({ context });
  writeArtifact('pages/b.json', { id: 'page:b' });
  const cached = hashBuild({ context });
  fs.rmSync(context.directories.test, { recursive: true });
  expect(hashBuild({ context })).toEqual(cached);
});

test('a cache of another version or build directory is not read', () => {
  withTestDirectory();
  writeBuild({});
  const first = hashBuild({ context });
  const cachePath = path.join(context.directories.test, 'build-hashes.json');
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  const { mtimeMs, size } = fs.statSync(path.join(build(), 'pages', 'a.json'));
  const wrong = { size, mtimeMs, hash: 'wrong' };
  fs.writeFileSync(
    cachePath,
    JSON.stringify({
      ...cache,
      version: 0,
      artifacts: { ...cache.artifacts, 'pages/a.json': wrong },
    })
  );
  expect(hashBuild({ context })).toEqual(first);
  fs.writeFileSync(
    cachePath,
    JSON.stringify({
      ...cache,
      buildDirectory: context.directories.build,
      artifacts: { ...cache.artifacts, 'pages/a.json': wrong },
    })
  );
  expect(hashBuild({ context })).toEqual(first);
});

test('a cache cut short is read as no cache', () => {
  withTestDirectory();
  writeBuild({});
  const first = hashBuild({ context });
  fs.writeFileSync(path.join(context.directories.test, 'build-hashes.json'), '{"vers');
  expect(hashBuild({ context })).toEqual(first);
});
