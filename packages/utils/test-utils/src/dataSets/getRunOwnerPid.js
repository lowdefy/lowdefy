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

import pickRunOwnerPid from './pickRunOwnerPid.js';

// Read once, when the harness loads, which is as a test file starts: process.ppid is read live,
// and it changes when the parent dies.
const parentPidAtLoad = process.ppid;

// The process a test run's data store lives and dies with: the `node --test` runner that
// started this test file, or this process itself when it has no runner above it or its runner
// is gone (pickRunOwnerPid).
function getRunOwnerPid() {
  return pickRunOwnerPid({
    parentPid: process.ppid,
    parentPidAtLoad,
    pid: process.pid,
    testContext: process.env.NODE_TEST_CONTEXT,
  });
}

export default getRunOwnerPid;
