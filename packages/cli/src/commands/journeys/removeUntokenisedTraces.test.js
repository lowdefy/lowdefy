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

const { default: removeUntokenisedTraces } = await import('./removeUntokenisedTraces.js');
const { default: readProductionTrace } = await import('./readProductionTrace.js');
const { default: readTraceSalt } = await import('./pull/readTraceSalt.js');

let root;
let directories;
let logger;
const now = Date.parse('2026-10-03T12:00:00.000Z');
const anHourAgo = new Date(now - 60 * 60 * 1000);

function production(...parts) {
  return path.join(directories.traces, 'production', ...parts);
}

function writeFile(filePath, text, { age = anHourAgo } = {}) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text);
  fs.utimesSync(filePath, age, age);
}

// A token day, the leftovers of a stopped old-rule pull, and every file the
// cleanup must leave alone.
function writeCache() {
  writeFile(production('salt'), Buffer.alloc(32, 3));
  const { saltId } = readTraceSalt({ directories });
  writeFile(production('2026-10-03.jsonl'), '{"id":1}\n');
  writeFile(
    production('2026-10-03.manifest.json'),
    JSON.stringify({ day: '2026-10-03', salt_id: saltId, text_rule: 'token' })
  );
  writeFile(
    production('2026-10-01.jsonl'),
    `${JSON.stringify({ id: 2, target: { block_id: 'grid', text: 'Acme Ltd' } })}\n`
  );
  writeFile(production('2026-10-02.jsonl.tmp'), '{"id":3}\n');
  writeFile(production('2026-10-02.manifest.json.tmp'), '{"day":"2026-10-02"}\n');
  writeFile(
    path.join(directories.config, 'tests', 'journeys', '_candidates', 'production', 'a.yaml'),
    'name: a\n'
  );
  writeFile(path.join(directories.config, 'tests', 'journeys', 'orders.yaml'), 'name: orders\n');
  writeFile(path.join(directories.test, 'coverage.json'), '{}');
  writeFile(path.join(directories.traces, 'dev', 'session.jsonl'), '{"id":4}\n');
  writeFile(path.join(directories.traces, 'explorer', 'walk.jsonl'), '{"id":5}\n');
}

function expectOnlyLeftoversRemoved() {
  expect(fs.readdirSync(production()).sort()).toEqual([
    '2026-10-03.jsonl',
    '2026-10-03.manifest.json',
    'salt',
  ]);
  [
    path.join(directories.config, 'tests', 'journeys', '_candidates', 'production', 'a.yaml'),
    path.join(directories.config, 'tests', 'journeys', 'orders.yaml'),
    path.join(directories.test, 'coverage.json'),
    path.join(directories.traces, 'dev', 'session.jsonl'),
    path.join(directories.traces, 'explorer', 'walk.jsonl'),
  ].forEach((filePath) => expect(fs.existsSync(filePath)).toBe(true));
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-untokenised-'));
  directories = {
    config: root,
    test: path.join(root, '.lowdefy', 'test'),
    traces: path.join(root, '.lowdefy', 'traces'),
  };
  logger = { warn: jest.fn() };
  mockReadConfigText.mockReset();
  mockReadConfigText.mockResolvedValue({ texts: new Set(), isConfigText: () => false });
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('removeUntokenisedTraces removes records without a manifest and .tmp files, and nothing else', () => {
  writeCache();
  const result = removeUntokenisedTraces({ directories, logger, now });
  expect(result).toEqual({
    days: [],
    leftovers: ['2026-10-01.jsonl', '2026-10-02.jsonl.tmp', '2026-10-02.manifest.json.tmp'],
  });
  expectOnlyLeftoversRemoved();
  expect(logger.warn).toHaveBeenCalledWith(
    'Removed 3 production trace files a stopped pull left unfinished.'
  );
});

test('a production read removes the leftovers and keeps the token day', async () => {
  writeCache();
  const { records } = await readProductionTrace({
    context: { directories, logger },
    since: '1d',
    now,
  });
  expect(records).toEqual([{ id: 1 }]);
  expectOnlyLeftoversRemoved();
});

test('removeUntokenisedTraces leaves a file a pull may be writing now', () => {
  writeFile(production('2026-10-02.jsonl.tmp'), '{"id":3}\n', { age: new Date(now - 1000) });
  writeFile(production('2026-10-02.jsonl'), '{"id":3}\n', { age: new Date(now - 1000) });
  const result = removeUntokenisedTraces({ directories, logger, now });
  expect(result).toEqual({ days: [], leftovers: [] });
  expect(fs.readdirSync(production()).sort()).toEqual(['2026-10-02.jsonl', '2026-10-02.jsonl.tmp']);
  expect(logger.warn).not.toHaveBeenCalled();
});

test('removeUntokenisedTraces does nothing when there is no production cache', () => {
  expect(removeUntokenisedTraces({ directories, logger, now })).toEqual({
    days: [],
    leftovers: [],
  });
  expect(logger.warn).not.toHaveBeenCalled();
});
