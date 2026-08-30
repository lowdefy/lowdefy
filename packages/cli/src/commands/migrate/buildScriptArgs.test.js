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

import buildScriptArgs from './buildScriptArgs.js';

test('buildScriptArgs returns no flags for a bare run', () => {
  expect(buildScriptArgs({ options: {} })).toEqual([]);
});

test('buildScriptArgs forwards --dry-run', () => {
  expect(buildScriptArgs({ options: { dryRun: true } })).toEqual(['--dry-run']);
});

test('buildScriptArgs forwards --to with its value', () => {
  expect(buildScriptArgs({ options: { to: '2026-08-30-01-a' } })).toEqual([
    '--to',
    '2026-08-30-01-a',
  ]);
});

test('buildScriptArgs ignores an empty --to', () => {
  expect(buildScriptArgs({ options: { to: '' } })).toEqual([]);
});

test('buildScriptArgs forwards --allow-checksum-mismatch and --json', () => {
  expect(
    buildScriptArgs({ options: { allowChecksumMismatch: true, json: true } })
  ).toEqual(['--allow-checksum-mismatch', '--json']);
});

test('buildScriptArgs combines all flags in a stable order', () => {
  expect(
    buildScriptArgs({
      options: { dryRun: true, to: 'm2', allowChecksumMismatch: true, json: true },
    })
  ).toEqual(['--dry-run', '--to', 'm2', '--allow-checksum-mismatch', '--json']);
});
