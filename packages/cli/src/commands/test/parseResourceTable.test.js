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

import { expect, test } from 'vitest';

import parseResourceTable from './parseResourceTable.js';

test('parseResourceTable reads pid, ppid, rss in bytes and CPU seconds from macOS ps', () => {
  expect(
    parseResourceTable('  100     1  65536   1:23.45\n  101   100   2048   0:00.50\n')
  ).toEqual([
    { pid: 100, ppid: 1, rssBytes: 65536 * 1024, cpuSeconds: 83.45 },
    { pid: 101, ppid: 100, rssBytes: 2048 * 1024, cpuSeconds: 0.5 },
  ]);
});

test('parseResourceTable reads Linux times with hours and days', () => {
  expect(
    parseResourceTable('200 1 100 01:02:03\n201 200 100 2-00:00:10\n').map(
      ({ cpuSeconds }) => cpuSeconds
    )
  ).toEqual([3723, 2 * 86400 + 10]);
});

test('parseResourceTable leaves out lines that do not parse', () => {
  expect(parseResourceTable('')).toEqual([]);
  expect(parseResourceTable('garbage\n  300 1 abc 0:01\n301 1 10 x:y\n')).toEqual([]);
});
