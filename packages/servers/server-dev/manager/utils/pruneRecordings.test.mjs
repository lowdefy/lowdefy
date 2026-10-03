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

import pruneRecordings from './pruneRecordings.mjs';

const NOW = Date.parse('2026-10-03T12:00:00Z');
let configDirectory;

function tracePath(...segments) {
  return path.join(configDirectory, '.lowdefy', 'traces', ...segments);
}

function writeFile({ segments, size = 10, mtimeMs = NOW }) {
  const filePath = tracePath(...segments);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, 'x'.repeat(size));
  fs.utimesSync(filePath, mtimeMs / 1000, mtimeMs / 1000);
  return filePath;
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-prune-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('pruneRecordings deletes date directories older than 7 days under dev, journey and explorer', () => {
  ['dev', 'journey', 'explorer'].forEach((source) => {
    writeFile({ segments: [source, '2026-09-25', '20260925T100000Z-old000.jsonl'] });
    writeFile({ segments: [source, '2026-09-26', '20260926T100000Z-keep00.jsonl'] });
  });
  const deleted = pruneRecordings({ configDirectory, now: NOW });
  expect(deleted.directories).toHaveLength(3);
  ['dev', 'journey', 'explorer'].forEach((source) => {
    expect(fs.existsSync(tracePath(source, '2026-09-25'))).toBe(false);
    expect(fs.existsSync(tracePath(source, '2026-09-26', '20260926T100000Z-keep00.jsonl'))).toBe(
      true
    );
  });
});

test('pruneRecordings trims the oldest files by mtime until the rest fit, keeping the newest', () => {
  const oldest = writeFile({
    segments: ['dev', '2026-10-03', '20261003T080000Z-aaaaaa.jsonl'],
    size: 40,
    mtimeMs: NOW - 3000,
  });
  const middle = writeFile({
    segments: ['journey', '2026-10-03', '20261003T090000Z-bbbbbb.jsonl'],
    size: 40,
    mtimeMs: NOW - 2000,
  });
  const newest = writeFile({
    segments: ['dev', '2026-10-03', '20261003T100000Z-cccccc.jsonl'],
    size: 40,
    mtimeMs: NOW - 1000,
  });
  const deleted = pruneRecordings({ configDirectory, now: NOW, maxBytes: 90 });
  expect(deleted.files).toEqual([oldest]);
  expect(fs.existsSync(middle)).toBe(true);
  expect(fs.existsSync(newest)).toBe(true);
});

test('pruneRecordings never deletes the newest file, even when it alone is over the limit', () => {
  const older = writeFile({
    segments: ['dev', '2026-10-03', '20261003T080000Z-aaaaaa.jsonl'],
    size: 50,
    mtimeMs: NOW - 2000,
  });
  const newest = writeFile({
    segments: ['dev', '2026-10-03', '20261003T100000Z-cccccc.jsonl'],
    size: 200,
    mtimeMs: NOW - 1000,
  });
  pruneRecordings({ configDirectory, now: NOW, maxBytes: 100 });
  expect(fs.existsSync(older)).toBe(false);
  expect(fs.existsSync(newest)).toBe(true);
});

test('pruneRecordings leaves foreign files and the production cache alone', () => {
  const production = writeFile({
    segments: ['production', '2026-01-01', 'events.jsonl'],
    size: 500,
  });
  const foreignDirectory = writeFile({ segments: ['dev', 'scratch', 'notes.jsonl'], size: 500 });
  const foreignFile = writeFile({ segments: ['dev', '2026-10-03', 'notes.txt'], size: 500 });
  const loose = writeFile({ segments: ['dev', 'old.jsonl'], size: 500, mtimeMs: NOW - 99999 });
  writeFile({ segments: ['dev', '2026-10-03', '20261003T100000Z-cccccc.jsonl'], size: 10 });
  const deleted = pruneRecordings({ configDirectory, now: NOW, maxBytes: 1 });
  expect(deleted).toEqual({ directories: [], files: [] });
  [production, foreignDirectory, foreignFile, loose].forEach((filePath) => {
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

test('pruneRecordings does nothing when there are no traces', () => {
  expect(pruneRecordings({ configDirectory, now: NOW })).toEqual({ directories: [], files: [] });
});
