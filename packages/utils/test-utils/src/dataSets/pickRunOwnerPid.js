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

import { type } from '@lowdefy/helpers';

// Which process a test run's data store lives and dies with, from what the test process knows
// of itself:
// - testContext: NODE_TEST_CONTEXT, which `node --test` sets in each test file's process.
// - pid, parentPid: the process and its parent now.
// - parentPidAtLoad: its parent when the harness loaded, as the test file started.
//
// Under `node --test` the owner is the parent, the runner, so every file of the run names the
// same one. Anywhere else (a file run directly, --test-isolation=none, another test runner's
// worker) it is the process itself.
//
// A runner that was killed leaves its test files running, and the system gives them another
// parent: process 1, or a process that adopts orphans. None of those is the runner and none
// exits with the run, so a store owned by one would never stop. A test file whose parent has
// changed since it started, or is process 1, therefore owns its store itself, and the store
// stops when the file does.
function pickRunOwnerPid({ parentPid, parentPidAtLoad, pid, testContext }) {
  if (type.isNone(testContext)) return pid;
  if (parentPid !== parentPidAtLoad || parentPid === 1) return pid;
  return parentPid;
}

export default pickRunOwnerPid;
