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

import zlib from 'zlib';

import { vi, beforeEach, expect, test } from 'vitest';

import writeMaps from './writeMaps.js';
import testContext from '../test-utils/testContext.js';

const mockWriteBuildArtifact = vi.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
  context.writeCompressedMaps = undefined;
});

function writtenArtifacts() {
  return Object.fromEntries(mockWriteBuildArtifact.mock.calls);
}

test('writeMaps', async () => {
  context.keyMap = {
    key: 'value',
  };
  context.refMap = {
    ref: 'value',
  };
  await writeMaps({ context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    ['keyMap.json', '{"key":"value"}'],
    ['refMap.json', '{"ref":"value"}'],
  ]);
});

test('writeMaps writes refMap ids in the same order whatever order refs resolved in', async () => {
  const entries = {
    'pages.0': { parent: '2', lineNumber: 1, path: 'pages/a.yaml' },
    'pages.0~1': { parent: 'pages.0', lineNumber: 1, path: 'templates/page.yaml' },
    'pages.1': { parent: '2', lineNumber: 2, path: 'pages/b.yaml' },
    'pages.0.blocks.0': { parent: 'pages.0~1', lineNumber: 5, path: 'blocks/header.yaml' },
  };
  const written = [];
  for (const order of [
    ['pages.0', 'pages.0~1', 'pages.1', 'pages.0.blocks.0'],
    ['pages.1', 'pages.0.blocks.0', 'pages.0', 'pages.0~1'],
  ]) {
    mockWriteBuildArtifact.mockReset();
    context.keyMap = {};
    context.refMap = {};
    for (const id of order) {
      context.refMap[id] = entries[id];
    }
    await writeMaps({ context });
    written.push(mockWriteBuildArtifact.mock.calls[1][1]);
  }
  expect(written[0]).toEqual(written[1]);
  expect(Object.keys(JSON.parse(written[0]))).toEqual([
    'pages.0',
    'pages.0.blocks.0',
    'pages.0~1',
    'pages.1',
  ]);
});

test('writeMaps writes only the plain maps when writeCompressedMaps is not set', async () => {
  context.keyMap = { 1: { s: 'pages.0', p: '0', l: 3 } };
  context.refMap = { 1: { path: 'pages/a.yaml' } };
  await writeMaps({ context });
  expect(mockWriteBuildArtifact.mock.calls.map(([filePath]) => filePath)).toEqual([
    'keyMap.json',
    'refMap.json',
  ]);
});

test('writeMaps writes gzipped maps that gunzip to the plain files when writeCompressedMaps is true', async () => {
  context.writeCompressedMaps = true;
  context.keyMap = { 1: { s: 'pages.0', p: '0', l: 3 }, 2: { s: 'blocks.0', p: '1', r: '1' } };
  context.refMap = { 1: { path: 'pages/a.yaml', parent: '0', lineNumber: 4 } };
  await writeMaps({ context });
  const artifacts = writtenArtifacts();
  expect(Object.keys(artifacts)).toEqual([
    'keyMap.json',
    'refMap.json',
    'keyMap.json.gz',
    'refMap.json.gz',
  ]);
  expect(Buffer.isBuffer(artifacts['keyMap.json.gz'])).toBe(true);
  expect(zlib.gunzipSync(artifacts['keyMap.json.gz']).toString('utf8')).toBe(
    artifacts['keyMap.json']
  );
  expect(zlib.gunzipSync(artifacts['refMap.json.gz']).toString('utf8')).toBe(
    artifacts['refMap.json']
  );
});

test('writeMaps writes gzipped empty maps that gunzip to {}', async () => {
  context.writeCompressedMaps = true;
  context.keyMap = {};
  context.refMap = {};
  await writeMaps({ context });
  const artifacts = writtenArtifacts();
  expect(zlib.gunzipSync(artifacts['keyMap.json.gz']).toString('utf8')).toBe('{}');
  expect(zlib.gunzipSync(artifacts['refMap.json.gz']).toString('utf8')).toBe('{}');
});

test('writeMaps writes byte-identical gzipped maps for the same maps', async () => {
  context.writeCompressedMaps = true;
  const written = [];
  for (let run = 0; run < 2; run += 1) {
    mockWriteBuildArtifact.mockReset();
    context.keyMap = { 1: { s: 'pages.0', p: '0', l: 3 } };
    context.refMap = { 1: { path: 'pages/a.yaml' } };
    await writeMaps({ context });
    written.push(writtenArtifacts());
  }
  expect(written[0]['keyMap.json.gz'].equals(written[1]['keyMap.json.gz'])).toBe(true);
  expect(written[0]['refMap.json.gz'].equals(written[1]['refMap.json.gz'])).toBe(true);
  // The gzip header's MTIME field (bytes 4 to 7) is zero, so a later build
  // does not stamp a different time into it.
  expect([...written[0]['keyMap.json.gz'].subarray(4, 8)]).toEqual([0, 0, 0, 0]);
  expect([...written[0]['refMap.json.gz'].subarray(4, 8)]).toEqual([0, 0, 0, 0]);
});

test('keyMap is not an object', async () => {
  const writeBuildArtifact = vi.fn();
  const context = {
    keyMap: 'keyMap',
    refMap: {},
    writeCompressedMaps: true,
    writeBuildArtifact,
  };
  await expect(writeMaps({ context })).rejects.toThrow('keyMap is not an object.');
  expect(writeBuildArtifact).not.toHaveBeenCalled();
});

test('refMap is not an object', async () => {
  const writeBuildArtifact = vi.fn();
  const context = {
    refMap: 'refMap',
    keyMap: {},
    writeCompressedMaps: true,
    writeBuildArtifact,
  };
  await expect(writeMaps({ context })).rejects.toThrow('refMap is not an object.');
  expect(writeBuildArtifact).not.toHaveBeenCalled();
});
