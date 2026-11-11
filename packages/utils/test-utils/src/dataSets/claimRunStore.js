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

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// The first test process of a run to get here starts the run's data store: creating the record
// fails for every process but one (flag wx), so exactly one keeper is started. Returns the
// claim's token, which the keeper must find in the record to go on, or null when another
// process holds the claim.
function claimRunStore({ ownerPid, recordPath }) {
  const token = crypto.randomBytes(8).toString('hex');
  fs.mkdirSync(path.dirname(recordPath), { recursive: true });
  try {
    fs.writeFileSync(
      recordPath,
      JSON.stringify({ ownerPid, starterPid: process.pid, keeperPid: null, token, uri: null }),
      { flag: 'wx' }
    );
  } catch (error) {
    if (error.code === 'EEXIST') return null;
    throw error;
  }
  return token;
}

export default claimRunStore;
