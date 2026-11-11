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

// The process a test run's data store lives and dies with. `node --test` runs each test file in
// a child process and sets NODE_TEST_CONTEXT in it, so there the owner is the parent, the
// runner, and every file of the run names the same one. Anywhere else (a file run directly,
// --test-isolation=none, another test runner's worker) the owner is the process itself.
function getRunOwnerPid() {
  return type.isNone(process.env.NODE_TEST_CONTEXT) ? process.pid : process.ppid;
}

export default getRunOwnerPid;
