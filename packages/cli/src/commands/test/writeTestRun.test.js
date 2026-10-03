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

import writeTestRun from './writeTestRun.js';

let configDirectory;
let directories;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-run-'));
  directories = { config: configDirectory, test: path.join(configDirectory, '.lowdefy', 'test') };
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function result({ name, passed, recordedPassed }) {
  return {
    name,
    filePath: path.join(configDirectory, 'tests', 'journeys', `${name}.yaml`),
    journey: { name },
    passed,
    ...(recordedPassed === undefined
      ? {}
      : { recorded: { run: '20261003T090000Z-aaaaaa', passed: recordedPassed } }),
  };
}

test('writeTestRun writes the recorded run id and each journey pass from the recorded repetition', () => {
  writeTestRun({
    directories,
    results: [
      result({ name: 'saves', passed: true, recordedPassed: true }),
      // Flaky: the recorded first repetition failed, a later one passed.
      result({ name: 'closes', passed: false, recordedPassed: false }),
    ],
  });
  expect(JSON.parse(fs.readFileSync(path.join(directories.test, 'run.json'), 'utf8'))).toEqual({
    version: 1,
    run: '20261003T090000Z-aaaaaa',
    journeys: {
      'tests/journeys/saves.yaml#saves': { passed: true },
      'tests/journeys/closes.yaml#closes': { passed: false },
    },
  });
});

test('writeTestRun writes nothing for a run that recorded nothing', () => {
  writeTestRun({ directories, results: [result({ name: 'saves', passed: true })] });
  expect(fs.existsSync(path.join(directories.test, 'run.json'))).toBe(false);
});
