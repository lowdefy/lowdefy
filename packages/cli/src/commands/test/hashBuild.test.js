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
import { afterEach, beforeEach, expect, test } from 'vitest';

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
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function writeBuild({ page = { id: 'page:a', title: 'A' }, buildId = 'one', marker = 1 }) {
  const build = context.directories.dev + '/build';
  fs.mkdirSync(path.join(build, 'plugins'), { recursive: true });
  fs.mkdirSync(path.join(build, 'pages'), { recursive: true });
  fs.writeFileSync(path.join(build, 'plugins', 'blockMetas.json'), '{}');
  fs.writeFileSync(path.join(build, 'keyMap.json'), '{}');
  fs.writeFileSync(path.join(build, 'refMap.json'), '{}');
  fs.writeFileSync(path.join(build, 'appMeta.json'), JSON.stringify({ buildId }));
  fs.writeFileSync(path.join(build, 'pages', 'a.json'), JSON.stringify({ ...page, '~k': marker }));
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
