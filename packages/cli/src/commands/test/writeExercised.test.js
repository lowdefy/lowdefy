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

import readExercised from './readExercised.js';
import writeExercised from './writeExercised.js';

let directories;

beforeEach(() => {
  directories = { config: fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-exercised-')) };
});

afterEach(() => {
  fs.rmSync(directories.config, { recursive: true, force: true });
});

function result({ name, file, steps = [{ click: 'save' }], newestPassed = true, pages = [] }) {
  const journey = { name, pageId: 'form', steps };
  return {
    name,
    filePath: path.join(directories.config, file),
    journey,
    newestPassed,
    exercised: { pages, appEvents: true, requests: [], endpoints: [] },
  };
}

test('writeExercised merges runs of different journeys and keeps both entries', () => {
  writeExercised({
    directories,
    results: [result({ name: 'first', file: 'tests/journeys/a.yaml', pages: ['a'] })],
    buildId: 'build-1',
  });
  writeExercised({
    directories,
    results: [result({ name: 'second', file: 'tests/journeys/b.yaml', pages: ['b'] })],
    buildId: 'build-2',
  });
  const content = JSON.parse(
    fs.readFileSync(path.join(directories.config, '.lowdefy', 'test', 'exercised.json'), 'utf8')
  );
  expect(content.version).toEqual(1);
  expect(content.buildId).toEqual('build-2');
  expect(Object.keys(content.journeys)).toEqual([
    `${path.join('tests', 'journeys', 'a.yaml')}#first`,
    `${path.join('tests', 'journeys', 'b.yaml')}#second`,
  ]);
});

test('writeExercised skips a result with no measured path', () => {
  writeExercised({
    directories,
    results: [{ name: 'refused', filePath: path.join(directories.config, 'x.yaml') }],
    buildId: 'build-1',
  });
  expect(fs.existsSync(path.join(directories.config, '.lowdefy', 'test', 'exercised.json'))).toBe(
    false
  );
});

test('readExercised returns the entry while the journey is unchanged, and null once its hash no longer matches', () => {
  const run = result({ name: 'first', file: 'tests/journeys/a.yaml', newestPassed: false });
  writeExercised({ directories, results: [run], buildId: 'build-1' });
  const file = path.join('tests', 'journeys', 'a.yaml');
  expect(readExercised({ directories, file, journey: run.journey })).toEqual({
    hash: expect.stringMatching(/^[0-9a-f]{40}$/),
    passed: false,
    exercised: run.exercised,
  });
  expect(
    readExercised({
      directories,
      file,
      journey: { ...run.journey, steps: [{ click: 'cancel' }] },
    })
  ).toBeNull();
  expect(readExercised({ directories, file: 'other.yaml', journey: run.journey })).toBeNull();
});

test('readExercised returns null when nothing was recorded', () => {
  expect(
    readExercised({ directories, file: 'a.yaml', journey: { name: 'a', steps: [] } })
  ).toBeNull();
});
