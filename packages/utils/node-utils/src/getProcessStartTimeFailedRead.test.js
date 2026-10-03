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

const mockGetProcessStartTimeCommand = jest.fn();
jest.unstable_mockModule('./getProcessStartTimeCommand.js', () => ({
  default: mockGetProcessStartTimeCommand,
}));

const { default: getProcessStartTime } = await import('./getProcessStartTime.js');
const { default: readProcessStartTime } = await import('./readProcessStartTime.js');

// A reader that prints part of a start time and then fails or hangs: a slow
// PowerShell killed by the timeout, or ps exiting with an error.
function partialRead({ script, timeout }) {
  return {
    command: process.execPath,
    args: ['-e', `process.stdout.write('2026-10-03T07:2'); ${script}`],
    options: { timeout },
  };
}

test('getProcessStartTime returns null, not the partial output, when the read times out', () => {
  mockGetProcessStartTimeCommand.mockReturnValue(
    partialRead({ script: 'setTimeout(() => {}, 10000);', timeout: 1000 })
  );
  expect(getProcessStartTime({ pid: 4242 })).toBeNull();
}, 30000);

test('getProcessStartTime returns null, not the partial output, when the read fails', () => {
  mockGetProcessStartTimeCommand.mockReturnValue(
    partialRead({ script: 'process.exitCode = 1;', timeout: 15000 })
  );
  expect(getProcessStartTime({ pid: 4242 })).toBeNull();
}, 30000);

test('readProcessStartTime resolves to null, not the partial output, when the read times out', async () => {
  mockGetProcessStartTimeCommand.mockReturnValue(
    partialRead({ script: 'setTimeout(() => {}, 10000);', timeout: 1000 })
  );
  expect(await readProcessStartTime({ pid: 4242 })).toBeNull();
}, 30000);

test('readProcessStartTime resolves to null, not the partial output, when the read fails', async () => {
  mockGetProcessStartTimeCommand.mockReturnValue(
    partialRead({ script: 'process.exitCode = 1;', timeout: 15000 })
  );
  expect(await readProcessStartTime({ pid: 4242 })).toBeNull();
}, 30000);
