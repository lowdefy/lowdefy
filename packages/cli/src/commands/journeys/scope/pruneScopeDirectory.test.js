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

import pruneScopeDirectory from './pruneScopeDirectory.js';

const DAY = 24 * 60 * 60 * 1000;
let scopeDirectory;

function makeDirectory(relative, ageDays) {
  const directory = path.join(scopeDirectory, relative);
  fs.mkdirSync(directory, { recursive: true });
  const time = new Date(Date.now() - ageDays * DAY);
  fs.utimesSync(directory, time, time);
}

beforeEach(() => {
  scopeDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-scope-prune-'));
});

afterEach(() => {
  fs.rmSync(scopeDirectory, { recursive: true, force: true });
});

test('runs older than 14 days and trees and builds unused for 14 days are removed', async () => {
  makeDirectory('trees/old', 20);
  makeDirectory('trees/fresh', 2);
  makeDirectory('builds/old-7.0.0', 15);
  makeDirectory('builds/fresh-7.0.0', 1);
  makeDirectory('20260901T100000Z-aaaaaa', 30);
  makeDirectory('20261003T100000Z-bbbbbb', 1);
  fs.utimesSync(path.join(scopeDirectory, 'trees'), new Date(0), new Date(0));
  await pruneScopeDirectory({ scopeDirectory });
  expect(fs.readdirSync(path.join(scopeDirectory, 'trees'))).toEqual(['fresh']);
  expect(fs.readdirSync(path.join(scopeDirectory, 'builds'))).toEqual(['fresh-7.0.0']);
  expect(fs.readdirSync(scopeDirectory).sort()).toEqual([
    '20261003T100000Z-bbbbbb',
    'builds',
    'trees',
  ]);
});

test('a missing scope directory prunes nothing', async () => {
  expect(await pruneScopeDirectory({ scopeDirectory: path.join(scopeDirectory, 'none') })).toEqual(
    []
  );
});
