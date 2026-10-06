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

const SALT_ID = 'a1b2c3d4';

function resolve(token) {
  return token === 't_config' ? 'Save' : null;
}

function writeDay(day, { final = true, saltId = SALT_ID, records = [{ day }] } = {}) {
  const directory = path.join(directories.traces, 'production');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, `${day}.jsonl`),
    records.map((record) => `${JSON.stringify(record)}\n`).join('')
  );
  fs.writeFileSync(
    path.join(directory, `${day}.manifest.json`),
    JSON.stringify({ day, final, salt_id: saltId, text_rule: 'token' })
  );
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
  expect(listFinalDays({ directories, saltId: SALT_ID })).toEqual({
    days: ['2026-09-29', '2026-10-01', '2026-10-02'],
    otherSalt: [],
  });
});

test('listFinalDays leaves out final days pulled under another salt and names them', () => {
  writeDay('2026-10-01');
  writeDay('2026-10-03', { saltId: 'e5f6a7b8' });
  writeDay('2026-10-02', { saltId: 'e5f6a7b8' });
  writeDay('2026-10-04', { saltId: 'e5f6a7b8', final: false });
  expect(listFinalDays({ directories, saltId: SALT_ID })).toEqual({
    days: ['2026-10-01'],
    otherSalt: ['2026-10-02', '2026-10-03'],
  });
  expect(listFinalDays({ directories, saltId: null })).toEqual({
    days: [],
    otherSalt: ['2026-10-01', '2026-10-02', '2026-10-03'],
  });
});

test('listFinalDays is empty without a production cache', () => {
  expect(listFinalDays({ directories, saltId: SALT_ID })).toEqual({ days: [], otherSalt: [] });
});

test('readProductionMonths reads the final days of the months asked for and their final neighbours', () => {
  ['2026-08-31', '2026-09-01', '2026-09-15', '2026-09-30', '2026-10-01', '2026-10-02'].forEach(
    (day) => writeDay(day)
  );
  writeDay('2026-10-03', { final: false });
  const finalDays = listFinalDays({ directories, saltId: SALT_ID }).days;
  const result = readProductionMonths({ directories, finalDays, months: ['2026-09'], resolve });
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
  const finalDays = listFinalDays({ directories, saltId: SALT_ID }).days;
  const result = readProductionMonths({ directories, finalDays, months: ['2026-10'], resolve });
  expect(result.days).toEqual(['2026-10-01', '2026-10-03']);
});

test('readProductionMonths resolves clicked-text tokens to config text only', () => {
  const target = { block_id: 'save', text: 'stored text' };
  writeDay('2026-10-01', {
    records: [
      { day: '2026-10-01', target: { ...target, text_token: 't_config' } },
      { day: '2026-10-01', target: { ...target, text_token: 't_other' } },
    ],
  });
  const finalDays = listFinalDays({ directories, saltId: SALT_ID }).days;
  const result = readProductionMonths({ directories, finalDays, months: ['2026-10'], resolve });
  expect(result.records.map((record) => record.target)).toEqual([
    { block_id: 'save', text: 'Save', text_token: 't_config' },
    { block_id: 'save', text_token: 't_other' },
  ]);
});
