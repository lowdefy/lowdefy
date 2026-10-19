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

import readMutationReport from './readMutationReport.js';

let directory;

function writeReport(report) {
  fs.writeFileSync(path.join(directory, 'mutation.json'), JSON.stringify(report));
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-mutation-'));
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

test('readMutationReport returns null when no hardening run wrote a report', () => {
  expect(readMutationReport({ directories: { test: directory } })).toBeNull();
});

test('readMutationReport reads per-journey counts and the suite score', () => {
  writeReport({
    killed: 15,
    total: 20,
    journeys: [
      { file: 'tests/journeys/a.yaml', name: 'a', killed: 11, total: 12, unique: 2 },
      { file: 'tests/journeys/b.yaml', name: 'b', killed: 4, total: 5 },
    ],
  });
  const report = readMutationReport({ directories: { test: directory } });
  expect(report.score).toEqual({ killed: 15, total: 20 });
  expect(report.byJourney.get('tests/journeys/a.yaml#a')).toEqual({
    killed: 11,
    total: 12,
    unique: 2,
  });
  expect(report.byJourney.get('tests/journeys/b.yaml#b')).toEqual({ killed: 4, total: 5 });
});

test.each([
  [{ journeys: [] }, 'whole-number "killed" and "total"'],
  [{ killed: 1, total: 1 }, '"journeys" list'],
  [{ killed: 1, total: 1, journeys: [{ name: 'a', killed: 1, total: 1 }] }, '"file" and "name"'],
  [
    { killed: 1, total: 1, journeys: [{ file: 'f', name: 'a', killed: 3, total: 1 }] },
    'above "total"',
  ],
])('readMutationReport throws naming the path for a malformed report %#', (report, problem) => {
  writeReport(report);
  expect(() => readMutationReport({ directories: { test: directory } })).toThrow(
    `The mutation report at ${path.join(directory, 'mutation.json')} does not match its shape`
  );
  expect(() => readMutationReport({ directories: { test: directory } })).toThrow(problem);
});

test('readMutationReport throws naming the path for a file that is not JSON', () => {
  fs.writeFileSync(path.join(directory, 'mutation.json'), '{');
  expect(() => readMutationReport({ directories: { test: directory } })).toThrow(
    `The mutation report at ${path.join(directory, 'mutation.json')} is not JSON`
  );
});
