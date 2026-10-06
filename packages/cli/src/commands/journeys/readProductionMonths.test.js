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

import listFinalDays from './listFinalDays.js';
import readProductionMonths from './readProductionMonths.js';

let directories;

function writeDay(day, { final = true } = {}) {
  const directory = path.join(directories.traces, 'production');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, `${day}.jsonl`), `${JSON.stringify({ day })}\n`);
  fs.writeFileSync(path.join(directory, `${day}.manifest.json`), JSON.stringify({ day, final }));
}

beforeEach(() => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-months-'));
  directories = { traces: path.join(root, 'traces') };
});

afterEach(() => {
  fs.rmSync(path.dirname(directories.traces), { recursive: true, force: true });
});

test('listFinalDays lists the final days of the cache oldest first, gaps and all', () => {
  ['2026-10-02', '2026-09-29', '2026-09-30', '2026-10-01'].forEach((day) => writeDay(day));
  writeDay('2026-10-03', { final: false });
  writeDay('2026-10-04', { final: false });
  fs.rmSync(path.join(directories.traces, 'production', '2026-09-30.manifest.json'));
  expect(listFinalDays({ directories })).toEqual(['2026-09-29', '2026-10-01', '2026-10-02']);
});

test('listFinalDays is empty without a production cache', () => {
  expect(listFinalDays({ directories })).toEqual([]);
});

test('readProductionMonths reads the final days of the months asked for and their final neighbours', () => {
  ['2026-08-31', '2026-09-01', '2026-09-15', '2026-09-30', '2026-10-01', '2026-10-02'].forEach(
    (day) => writeDay(day)
  );
  writeDay('2026-10-03', { final: false });
  const finalDays = listFinalDays({ directories });
  const result = readProductionMonths({ directories, finalDays, months: ['2026-09'] });
  expect(result.days).toEqual(['2026-09-01', '2026-09-15', '2026-09-30']);
  expect(result.records.map((record) => record.day)).toEqual([
    '2026-08-31',
    '2026-09-01',
    '2026-09-15',
    '2026-09-30',
    '2026-10-01',
  ]);
  expect(result.unparsable).toBe(0);
});

test('readProductionMonths reads a month with a missing day without error', () => {
  ['2026-10-01', '2026-10-03'].forEach((day) => writeDay(day));
  const finalDays = listFinalDays({ directories });
  const result = readProductionMonths({ directories, finalDays, months: ['2026-10'] });
  expect(result.days).toEqual(['2026-10-01', '2026-10-03']);
});
