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

import pickRunOwnerPid from './pickRunOwnerPid.js';

test('pickRunOwnerPid is the parent, the runner, in a test file that node --test started', () => {
  expect(
    pickRunOwnerPid({ parentPid: 400, parentPidAtLoad: 400, pid: 500, testContext: 'child-v8' })
  ).toEqual(400);
});

test('pickRunOwnerPid is the process itself when no node --test runner started it', () => {
  expect(
    pickRunOwnerPid({ parentPid: 400, parentPidAtLoad: 400, pid: 500, testContext: undefined })
  ).toEqual(500);
});

test('pickRunOwnerPid is the process itself once its runner is gone and another process has adopted it', () => {
  expect(
    pickRunOwnerPid({ parentPid: 1, parentPidAtLoad: 400, pid: 500, testContext: 'child-v8' })
  ).toEqual(500);
  // A process that adopts orphans in place of process 1.
  expect(
    pickRunOwnerPid({ parentPid: 77, parentPidAtLoad: 400, pid: 500, testContext: 'child-v8' })
  ).toEqual(500);
});

test('pickRunOwnerPid is never process 1, which a file whose runner died before the harness loaded has as its parent', () => {
  expect(
    pickRunOwnerPid({ parentPid: 1, parentPidAtLoad: 1, pid: 500, testContext: 'child-v8' })
  ).toEqual(500);
});
