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

import readProductionTrace from './readProductionTrace.js';

let traces;
const now = Date.parse('2026-10-03T12:00:00.000Z');

function writeDay(day, records) {
  const directory = path.join(traces, 'production');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, `${day}.jsonl`),
    records.map((record) => JSON.stringify(record)).join('\n')
  );
  fs.writeFileSync(
    path.join(directory, `${day}.manifest.json`),
    JSON.stringify({ day, text_rule: 'token' })
  );
}

beforeEach(() => {
  traces = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-production-trace-'));
});

afterEach(() => {
  fs.rmSync(traces, { recursive: true, force: true });
});

test('readProductionTrace returns the window records in day order with each manifest', () => {
  writeDay('2026-10-03', [{ id: 5 }]);
  writeDay('2026-10-01', [{ id: 1 }, { id: 2 }]);
  writeDay('2026-10-02', [{ id: 3 }, { id: 4 }]);
  const result = readProductionTrace({ directories: { traces }, since: '3d', now });
  expect(result.records.map((record) => record.id)).toEqual([1, 2, 3, 4, 5]);
  expect(result.window).toEqual({ from: '2026-10-01', to: '2026-10-03' });
  expect(result.manifests.map((manifest) => manifest.day)).toEqual([
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
  ]);
  expect(result.unparsable).toBe(0);
});

test('readProductionTrace names a missing middle day and the pull that fills it', () => {
  writeDay('2026-10-01', []);
  writeDay('2026-10-03', []);
  expect(() => readProductionTrace({ directories: { traces }, since: '3d', now })).toThrow(
    'The production trace cache is missing 1 day(s) of 2026-10-01/2026-10-03 (2026-10-02). Run "lowdefy journeys pull posthog --from 2026-10-02 --to 2026-10-02" first.'
  );
});

test('readProductionTrace treats a day without its manifest as missing', () => {
  writeDay('2026-10-01', []);
  fs.rmSync(path.join(traces, 'production', '2026-10-01.manifest.json'));
  expect(() =>
    readProductionTrace({ directories: { traces }, from: '2026-10-01', to: '2026-10-01', now })
  ).toThrow('lowdefy journeys pull posthog --from 2026-10-01 --to 2026-10-01');
});

test('readProductionTrace counts unparsable lines', () => {
  writeDay('2026-10-03', [{ id: 1 }]);
  fs.appendFileSync(path.join(traces, 'production', '2026-10-03.jsonl'), '\nnot json');
  const result = readProductionTrace({ directories: { traces }, since: '1d', now });
  expect(result.records).toHaveLength(1);
  expect(result.unparsable).toBe(1);
});
