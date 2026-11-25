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

import zlib from 'node:zlib';

import { createColumnarKeyMap, encodeColumnarKeyMap } from '@lowdefy/errors';
import { expect, test } from 'vitest';

import compressBuildMaps from './compressBuildMaps.js';

const keyMap = { 1: { s: 'pages.0', p: '0', l: 3 }, 2: { s: 'blocks.0', p: '1', r: '1' } };
const refMapText = '{"1":{"path":"pages/a.yaml","parent":"0","lineNumber":4}}';

test('compressBuildMaps gzips the key map in columns and the ref map text as it is', async () => {
  const { keyMapGz, refMapGz } = await compressBuildMaps({ keyMap, refMapText });
  expect(Buffer.isBuffer(keyMapGz)).toBe(true);
  const columns = JSON.parse(zlib.gunzipSync(keyMapGz).toString('utf8'));
  expect(columns).toEqual(encodeColumnarKeyMap({ keyMap }));
  expect(createColumnarKeyMap(columns).get('2')).toEqual(keyMap['2']);
  expect(zlib.gunzipSync(refMapGz).toString('utf8')).toBe(refMapText);
});

test('compressBuildMaps writes empty columns and an empty ref map for empty maps', async () => {
  const { keyMapGz, refMapGz } = await compressBuildMaps({ keyMap: {}, refMapText: '{}' });
  expect(JSON.parse(zlib.gunzipSync(keyMapGz).toString('utf8'))).toEqual(
    encodeColumnarKeyMap({ keyMap: {} })
  );
  expect(zlib.gunzipSync(refMapGz).toString('utf8')).toBe('{}');
});

test('compressBuildMaps gives byte-identical gzips for the same maps, with no timestamp', async () => {
  const first = await compressBuildMaps({ keyMap, refMapText });
  const second = await compressBuildMaps({ keyMap, refMapText });
  expect(first.keyMapGz.equals(second.keyMapGz)).toBe(true);
  expect(first.refMapGz.equals(second.refMapGz)).toBe(true);
  // The gzip header's MTIME field (bytes 4 to 7) is zero, so a later build
  // does not stamp a different time into it.
  expect([...first.keyMapGz.subarray(4, 8)]).toEqual([0, 0, 0, 0]);
  expect([...first.refMapGz.subarray(4, 8)]).toEqual([0, 0, 0, 0]);
});
