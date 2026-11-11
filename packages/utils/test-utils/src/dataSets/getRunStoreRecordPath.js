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

import os from 'node:os';
import path from 'node:path';

// Where a run's test processes find its data store: one small file per owner process, in the
// machine's temporary directory. The folder is per user, since on Linux the temporary directory
// is shared and one user cannot write into a folder another made; Windows has no user id and
// a temporary directory per user.
function getRunStoreRecordPath({ ownerPid }) {
  const user = process.getuid?.() ?? 'user';
  return path.join(os.tmpdir(), `lowdefy-test-store-${user}`, `data-store-${ownerPid}.json`);
}

export default getRunStoreRecordPath;
