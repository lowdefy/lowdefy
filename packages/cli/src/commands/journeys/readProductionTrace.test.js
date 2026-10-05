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

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

const mockReadConfigText = jest.fn();
jest.unstable_mockModule('./configText/readConfigText.js', () => ({
  default: mockReadConfigText,
}));

const { default: readProductionTrace } = await import('./readProductionTrace.js');
const { default: tokenText } = await import('./tokenText.js');

let traces;
let root;
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

function read(options) {
  const context = {
    directories: { config: root, test: path.join(root, '.lowdefy', 'test'), traces },
    logger: { warn: jest.fn() },
  };
  return readProductionTrace({ context, now, ...options });
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-production-trace-'));
  traces = path.join(root, '.lowdefy', 'traces');
  mockReadConfigText.mockReset();
  mockReadConfigText.mockResolvedValue({
    texts: new Set(['Assign']),
    isConfigText: (text) => text === 'Assign',
  });
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('readProductionTrace returns the window records in day order with each manifest', async () => {
  writeDay('2026-10-03', [{ id: 5 }]);
  writeDay('2026-10-01', [{ id: 1 }, { id: 2 }]);
  writeDay('2026-10-02', [{ id: 3 }, { id: 4 }]);
  const result = await read({ since: '3d' });
  expect(result.records.map((record) => record.id)).toEqual([1, 2, 3, 4, 5]);
  expect(result.window).toEqual({ from: '2026-10-01', to: '2026-10-03' });
  expect(result.manifests.map((manifest) => manifest.day)).toEqual([
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
  ]);
  expect(result.unparsable).toBe(0);
});

test('readProductionTrace names a missing middle day and the pull that fills it', async () => {
  writeDay('2026-10-01', []);
  writeDay('2026-10-03', []);
  await expect(read({ since: '3d' })).rejects.toThrow(
    'The production trace cache is missing 1 day(s) of 2026-10-01/2026-10-03 (2026-10-02). Run "lowdefy journeys pull posthog --from 2026-10-02 --to 2026-10-02" first.'
  );
});

test('readProductionTrace treats a day without its manifest as missing', async () => {
  writeDay('2026-10-01', []);
  fs.rmSync(path.join(traces, 'production', '2026-10-01.manifest.json'));
  await expect(read({ from: '2026-10-01', to: '2026-10-01' })).rejects.toThrow(
    'lowdefy journeys pull posthog --from 2026-10-01 --to 2026-10-01'
  );
});

test('readProductionTrace counts unparsable lines', async () => {
  writeDay('2026-10-03', [{ id: 1 }]);
  fs.appendFileSync(path.join(traces, 'production', '2026-10-03.jsonl'), '\nnot json');
  const result = await read({ since: '1d' });
  expect(result.records).toHaveLength(1);
  expect(result.unparsable).toBe(1);
});

test('readProductionTrace resolves a token only to config text', async () => {
  fs.mkdirSync(path.join(traces, 'production'), { recursive: true });
  const salt = Buffer.alloc(32, 4);
  fs.writeFileSync(path.join(traces, 'production', 'salt'), salt);
  const assign = tokenText({ salt, text: 'Assign' });
  const acme = tokenText({ salt, text: 'Acme Ltd' });
  writeDay('2026-10-03', [
    { id: 1, target: { block_id: 'assign_button', text_token: assign } },
    { id: 2, target: { block_id: 'grid', text_token: acme } },
    { id: 3, target: { block_id: 'grid', text: 'Acme Ltd', text_token: acme } },
    { id: 4, target: null },
  ]);
  const { records } = await read({ since: '1d' });
  expect(records.map((record) => record.target)).toEqual([
    { block_id: 'assign_button', text_token: assign, text: 'Assign' },
    { block_id: 'grid', text_token: acme },
    { block_id: 'grid', text_token: acme },
    null,
  ]);
  expect(JSON.stringify(records)).not.toContain('Acme');
});

test('readProductionTrace refuses a window over maxDays', async () => {
  await expect(read({ since: '31d', maxDays: 30 })).rejects.toThrow(
    'a mining window is at most 30 days'
  );
});
