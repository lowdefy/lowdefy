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

import { afterAll, expect, test } from 'vitest';

import createGlobWatchPaths from './createGlobWatchPaths.mjs';

const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'lowdefy-glob-watch-'));
const shared = path.join(root, 'shared');
fs.mkdirSync(path.join(shared, 'nested'), { recursive: true });

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('plain watch paths are watched as they are, with nothing ignored', () => {
  const app = path.join(root, 'app');
  expect(createGlobWatchPaths([app, path.join(root, 'lowdefy.yaml')])).toEqual({
    watchPaths: [app, path.join(root, 'lowdefy.yaml')],
    ignore: null,
  });
});

test('a glob is watched from the directory it starts at', () => {
  const { watchPaths } = createGlobWatchPaths([path.join(shared, '**', '*.yaml')]);
  expect(watchPaths).toEqual([shared]);
});

test('files under a glob base that the glob does not match are ignored', () => {
  const { ignore } = createGlobWatchPaths([path.join(shared, '**', '*.yaml')]);
  expect(ignore(path.join(shared, 'page.yaml'))).toBe(false);
  expect(ignore(path.join(shared, 'nested', 'page.yaml'))).toBe(false);
  expect(ignore(path.join(shared, 'notes.md'))).toBe(true);
  expect(ignore(path.join(shared, 'nested', 'notes.md'))).toBe(true);
});

test('directories under a glob base are never ignored, so they are walked', () => {
  const { ignore } = createGlobWatchPaths([path.join(shared, '**', '*.yaml')]);
  expect(ignore(path.join(shared, 'nested'))).toBe(false);
  expect(ignore(path.join(shared, 'other'), { isDirectory: () => true })).toBe(false);
});

test('paths outside every glob base, or under a plain watch path, are not ignored', () => {
  const app = path.join(root, 'app');
  const { watchPaths, ignore } = createGlobWatchPaths([app, path.join(shared, '*.yaml')]);
  expect(watchPaths).toEqual([app, shared]);
  expect(ignore(path.join(app, 'notes.md'))).toBe(false);
  expect(ignore(path.join(root, 'other', 'notes.md'))).toBe(false);
  expect(ignore(path.join(shared, 'notes.md'))).toBe(true);
});
