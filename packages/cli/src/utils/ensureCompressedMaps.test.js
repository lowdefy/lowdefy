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
import zlib from 'zlib';

import { createColumnarKeyMap } from '@lowdefy/errors';
import { compressBuildMaps } from '@lowdefy/node-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import ensureCompressedMaps from './ensureCompressedMaps.js';

// The key map the build holds, and keyMap.json as the build writes it: an
// ignored checks list carries the serializer's array marker and line.
const keyMap = {
  1: { s: 'root', p: '0', r: 'ref-1', l: 1 },
  2: { s: '.pages', p: '1', l: 2, i: ['state-refs'] },
  3: { s: '[0:home:Box]', p: '2', r: 'ref-2', l: 3, i: true },
};
const keyMapText =
  '{"1":{"s":"root","p":"0","r":"ref-1","l":1},' +
  '"2":{"s":".pages","p":"1","l":2,"i":{"~arr":["state-refs"],"~l":5}},' +
  '"3":{"s":"[0:home:Box]","p":"2","r":"ref-2","l":3,"i":true}}';
const refMapText =
  '{"ref-1":{"parent":null,"path":"lowdefy.yaml"},"ref-2":{"parent":"ref-1","path":"pages/home.yaml","lineNumber":2}}';

let root;
let buildDirectory;
let outputBuildDirectory;
let logger;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-ensure-compressed-maps-'));
  buildDirectory = path.join(root, 'server', 'build');
  outputBuildDirectory = path.join(root, 'output', 'build');
  fs.mkdirSync(buildDirectory, { recursive: true });
  fs.mkdirSync(outputBuildDirectory, { recursive: true });
  fs.writeFileSync(path.join(buildDirectory, 'keyMap.json'), keyMapText);
  fs.writeFileSync(path.join(buildDirectory, 'refMap.json'), refMapText);
  logger = { info: vi.fn() };
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function readOutput(file) {
  return fs.readFileSync(path.join(outputBuildDirectory, file));
}

test('ensureCompressedMaps writes the gzips a build would have written when the build has none', async () => {
  await ensureCompressedMaps({ buildDirectory, outputBuildDirectory, logger });
  const expected = await compressBuildMaps({ keyMap, refMapText });
  expect(readOutput('keyMap.json.gz').equals(expected.keyMapGz)).toBe(true);
  expect(readOutput('refMap.json.gz').equals(expected.refMapGz)).toBe(true);
  const columns = JSON.parse(zlib.gunzipSync(readOutput('keyMap.json.gz')).toString('utf8'));
  expect(createColumnarKeyMap(columns).get('2')).toEqual(keyMap[2]);
  expect(zlib.gunzipSync(readOutput('refMap.json.gz')).toString('utf8')).toBe(refMapText);
  expect(logger.info).toHaveBeenCalledWith('Wrote the gzipped error maps from the plain maps.');
});

test('ensureCompressedMaps leaves the copied gzips alone when the build wrote them', async () => {
  fs.writeFileSync(path.join(buildDirectory, 'keyMap.json.gz'), 'built key map');
  fs.writeFileSync(path.join(buildDirectory, 'refMap.json.gz'), 'built ref map');
  fs.writeFileSync(path.join(outputBuildDirectory, 'keyMap.json.gz'), 'built key map');
  fs.writeFileSync(path.join(outputBuildDirectory, 'refMap.json.gz'), 'built ref map');
  await ensureCompressedMaps({ buildDirectory, outputBuildDirectory, logger });
  expect(readOutput('keyMap.json.gz').toString()).toBe('built key map');
  expect(readOutput('refMap.json.gz').toString()).toBe('built ref map');
  expect(logger.info).not.toHaveBeenCalled();
});

test('ensureCompressedMaps writes both gzips when the build has only one', async () => {
  fs.writeFileSync(path.join(buildDirectory, 'refMap.json.gz'), 'stale');
  fs.writeFileSync(path.join(outputBuildDirectory, 'refMap.json.gz'), 'stale');
  await ensureCompressedMaps({ buildDirectory, outputBuildDirectory, logger });
  expect(zlib.gunzipSync(readOutput('refMap.json.gz')).toString('utf8')).toBe(refMapText);
  expect(fs.existsSync(path.join(outputBuildDirectory, 'keyMap.json.gz'))).toBe(true);
});

test('ensureCompressedMaps writes nothing for a build folder with no maps', async () => {
  fs.rmSync(path.join(buildDirectory, 'keyMap.json'));
  fs.rmSync(path.join(buildDirectory, 'refMap.json'));
  await ensureCompressedMaps({ buildDirectory, outputBuildDirectory, logger });
  expect(fs.readdirSync(outputBuildDirectory)).toEqual([]);
  expect(logger.info).not.toHaveBeenCalled();
});
