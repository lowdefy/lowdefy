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
import { validate } from '@lowdefy/ajv';

import coverageReportSchema from './coverageReportSchema.js';
import writeCoverageReport from './writeCoverageReport.js';

let test_directory;

const measure = { covered: 1, total: 2, share: 0.5, uncovered: [{ key: 'a', count: 1 }] };
const input = {
  window: { from: '2026-09-04', to: '2026-10-03' },
  measures: {
    interaction: measure,
    flow: measure,
    failure: { mode: 'reached', note: 'reached', ...measure },
    frustration: measure,
    role: measure,
  },
  profile: {
    flows: [],
    failurePaths: [],
    frustration: [],
    roleMatrix: [],
    entryPoints: [],
    textTokens: [],
  },
  journeys: [
    {
      file: 'tests/journeys/saves.yaml',
      name: 'saves',
      pageId: 'tickets',
      sequence: [{ page: 'tickets', identity: '["click","save",null,null]' }],
      journey: { name: 'saves', pageId: 'tickets', steps: [{ click: 'save' }] },
    },
  ],
};

beforeEach(() => {
  test_directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-coverage-'));
});

afterEach(() => {
  fs.rmSync(test_directory, { recursive: true, force: true });
});

test('writeCoverageReport writes a report that validates against its schema', () => {
  const { report, reportPath } = writeCoverageReport({
    directories: { test: test_directory },
    generated: '2026-10-03T12:00:00.000Z',
    ...input,
  });
  expect(reportPath).toBe(path.join(test_directory, 'coverage.json'));
  expect(JSON.parse(fs.readFileSync(reportPath, 'utf8'))).toEqual(report);
  expect(validate({ schema: coverageReportSchema, data: report })).toEqual({ valid: true });
  expect(report).not.toHaveProperty('mutation');
  expect(report.journeys[0]).not.toHaveProperty('journey');
});

test('writeCoverageReport gives the same bytes for the same inputs apart from generated', () => {
  writeCoverageReport({ directories: { test: test_directory }, generated: 'one', ...input });
  const first = fs.readFileSync(path.join(test_directory, 'coverage.json'), 'utf8');
  writeCoverageReport({ directories: { test: test_directory }, generated: 'two', ...input });
  const second = fs.readFileSync(path.join(test_directory, 'coverage.json'), 'utf8');
  expect(second.replace('"two"', '"one"')).toBe(first);
});

test('coverageReportSchema refuses a report with an unknown top-level key', () => {
  const { report } = writeCoverageReport({
    directories: { test: test_directory },
    generated: 'x',
    ...input,
  });
  expect(() => validate({ schema: coverageReportSchema, data: { ...report, extra: 1 } })).toThrow();
});

const RUN = '20261003T090000Z-aaaaaa';

test('coverageReportSchema accepts the measured interaction share and measured failure coverage', () => {
  const { report } = writeCoverageReport({
    directories: { test: test_directory },
    generated: 'x',
    ...input,
    measures: {
      ...input.measures,
      interaction: { ...measure, measured: { covered: 1, total: 2, share: 0.5, run: RUN } },
      failure: { mode: 'measured', note: 'measured', run: RUN, ...measure },
    },
  });
  expect(validate({ schema: coverageReportSchema, data: report })).toEqual({ valid: true });
});

test('coverageReportSchema refuses a failure mode other than reached or measured', () => {
  const { report } = writeCoverageReport({
    directories: { test: test_directory },
    generated: 'x',
    ...input,
    measures: { ...input.measures, failure: { mode: 'asserted', note: 'x', ...measure } },
  });
  expect(() => validate({ schema: coverageReportSchema, data: report })).toThrow();
});

test('coverageReportSchema refuses a measured interaction share without its run', () => {
  const { report } = writeCoverageReport({
    directories: { test: test_directory },
    generated: 'x',
    ...input,
    measures: {
      ...input.measures,
      interaction: { ...measure, measured: { covered: 1, total: 2, share: 0.5 } },
    },
  });
  expect(() => validate({ schema: coverageReportSchema, data: report })).toThrow();
});
