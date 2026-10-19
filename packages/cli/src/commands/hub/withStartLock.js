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

import fs from 'fs';
import { wait } from '@lowdefy/helpers';

// The lock is held for the few milliseconds it takes to check, remove and
// re-listen on the socket. One older than this was left by a hub that died
// holding it.
const STALE_LOCK_MS = 10000;

function tryLock({ lockPath }) {
  try {
    fs.mkdirSync(lockPath);
    return true;
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  try {
    if (Date.now() - fs.statSync(lockPath).mtimeMs > STALE_LOCK_MS) {
      fs.rmSync(lockPath, { recursive: true, force: true });
    }
  } catch {
    // Released between the failed create and the stat - try again.
  }
  return false;
}

// Runs task while holding a lock shared by every hub of this LOWDEFY_HOME.
// Creating a directory is atomic, so exactly one hub holds it at a time.
async function withStartLock({ lockPath }, task) {
  while (!tryLock({ lockPath })) {
    await wait(20);
  }
  try {
    return await task();
  } finally {
    fs.rmSync(lockPath, { recursive: true, force: true });
  }
}

export default withStartLock;
