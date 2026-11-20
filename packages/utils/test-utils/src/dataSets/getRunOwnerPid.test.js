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

import { afterEach, expect, test, vi } from 'vitest';

import getRunOwnerPid from './getRunOwnerPid.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

test('getRunOwnerPid is the parent process in a test file that node --test started', () => {
  vi.stubEnv('NODE_TEST_CONTEXT', 'child-v8');
  expect(getRunOwnerPid()).toEqual(process.ppid);
});

test('getRunOwnerPid is the process itself when no node --test runner started it', () => {
  vi.stubEnv('NODE_TEST_CONTEXT', undefined);
  expect(getRunOwnerPid()).toEqual(process.pid);
});
