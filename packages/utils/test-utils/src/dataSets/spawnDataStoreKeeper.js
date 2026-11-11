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

import { spawn } from 'node:child_process';
import path from 'node:path';

// Starts the keeper (dataStoreKeeperProcess.js) in a process group of its own, with no pipe to
// this process, so it outlives the test file that started it and serves the run's other files.
// It gets a plain Node: none of this process's flags (--test among them), and not
// NODE_TEST_CONTEXT, which would make it and mongodb-memory-server's helper processes report
// to a test runner that is not listening.
function spawnDataStoreKeeper({ ownerPid, recordPath, token }) {
  // eslint-disable-next-line no-unused-vars
  const { NODE_TEST_CONTEXT, NODE_OPTIONS, ...env } = process.env;
  const keeper = spawn(
    process.execPath,
    [
      path.join(import.meta.dirname, 'dataStoreKeeperProcess.js'),
      String(ownerPid),
      recordPath,
      token,
    ],
    { detached: true, env, stdio: 'ignore' }
  );
  keeper.unref();
}

export default spawnDataStoreKeeper;
