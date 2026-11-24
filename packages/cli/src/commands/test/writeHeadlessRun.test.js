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

import hashJourney from './hashJourney.js';
import writeHeadlessRun from './writeHeadlessRun.js';

let directories;

beforeEach(() => {
  const config = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-headless-run-'));
  directories = { config, test: path.join(config, '.lowdefy', 'test') };
});

afterEach(() => {
  fs.rmSync(directories.config, { recursive: true, force: true });
});

function resultOf({ name, file = 'a.yaml', ...rest }) {
  const journey = { name, pageId: 'form', steps: [{ click: name }] };
  return {
    name,
    filePath: path.join(directories.config, 'tests', 'journeys', file),
    journey,
    ...rest,
  };
}

function read() {
  return JSON.parse(fs.readFileSync(path.join(directories.test, 'headless-run.json'), 'utf8'));
}

const PARTWAY = { index: 1, step: { click: 'next' }, reason: 'needs a browser here' };

test('records each journey with the hashes of the journey and the config it ran on', () => {
  const passed = resultOf({ name: 'saves', passed: true });
  const found = resultOf({ name: 'goes next', file: 'b.yaml', browserOnly: PARTWAY });
  writeHeadlessRun({
    directories,
    results: [passed],
    browserOnly: [found],
    mode: 'dev',
    configHashes: ['config-1', 'config-2'],
  });
  expect(read()).toEqual({
    version: 1,
    mode: 'dev',
    journeys: {
      'tests/journeys/a.yaml#saves': {
        passed: true,
        hash: hashJourney(passed.journey),
        configHashes: ['config-1', 'config-2'],
      },
      'tests/journeys/b.yaml#goes next': {
        browserOnly: PARTWAY,
        hash: hashJourney(found.journey),
        configHashes: ['config-1', 'config-2'],
      },
    },
  });
});

test('keeps the records of journeys a later run did not run headless', () => {
  writeHeadlessRun({
    directories,
    results: [],
    browserOnly: [resultOf({ name: 'goes next', file: 'b.yaml', browserOnly: PARTWAY })],
    mode: 'dev',
    configHashes: ['config-1', 'config-1'],
  });
  const kept = read().journeys['tests/journeys/b.yaml#goes next'];
  writeHeadlessRun({
    directories,
    results: [resultOf({ name: 'saves', passed: false })],
    browserOnly: [],
    mode: 'build',
  });
  const written = read();
  expect(written.mode).toBe('build');
  expect(written.journeys['tests/journeys/b.yaml#goes next']).toEqual(kept);
  // The production build's records carry no config hash, so a dev run never reads them.
  expect(written.journeys['tests/journeys/a.yaml#saves']).toMatchObject({
    passed: false,
    configHashes: [],
  });
  // One hash when the run built no page, and none it could not read.
  expect(kept.configHashes).toEqual(['config-1']);
});

test('records a journey file that did not parse with no journey hash', () => {
  writeHeadlessRun({
    directories,
    results: [
      {
        name: path.join(directories.config, 'tests', 'journeys', 'bad.yaml'),
        filePath: path.join(directories.config, 'tests', 'journeys', 'bad.yaml'),
        passed: false,
        refused: true,
      },
    ],
    browserOnly: [],
    mode: 'dev',
    configHashes: ['config-1', null],
  });
  expect(Object.values(read().journeys)).toEqual([
    { passed: false, hash: null, configHashes: ['config-1'] },
  ]);
});
