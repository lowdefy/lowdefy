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

import writeTestResults from './writeTestResults.js';
import { afterEach, beforeEach, expect, test } from 'vitest';

let configDirectory;
let directories;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-results-'));
  directories = { config: configDirectory, test: path.join(configDirectory, '.lowdefy', 'test') };
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('writeTestResults writes the summary and every result and returns the file path', () => {
  const results = [
    { name: 'saves', passed: true, report: 'PASS  saves  (2 steps, 40ms)' },
    { name: 'closes', passed: false, report: 'FAIL  closes' },
  ];
  const skipped = [{ name: 'old', skipped: 'deprecated', report: 'SKIP  old' }];

  const filePath = writeTestResults({
    directories,
    summary: '1 passed, 1 failed of 2 journeys, 1 deprecated skipped',
    results,
    skipped,
  });

  expect(filePath).toEqual(path.join(directories.test, 'results.json'));
  const written = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  expect(written).toMatchObject({
    version: 1,
    summary: '1 passed, 1 failed of 2 journeys, 1 deprecated skipped',
    results,
    skipped,
  });
  expect(Number.isNaN(Date.parse(written.at))).toBe(false);
});

test('writeTestResults replaces the results of the run before it', () => {
  writeTestResults({ directories, summary: 'first', results: [{ name: 'a' }], skipped: [] });
  const filePath = writeTestResults({ directories, summary: 'second', results: [], skipped: [] });

  expect(JSON.parse(fs.readFileSync(filePath, 'utf8'))).toMatchObject({
    summary: 'second',
    results: [],
  });
});
