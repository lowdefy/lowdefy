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

import runDataStoreKeeper from './runDataStoreKeeper.js';

// The entry of a test run's data store keeper, started by spawnDataStoreKeeper with the owner's
// pid, the record's path and the claim's token.
const [ownerPid, recordPath, token] = process.argv.slice(2);

await runDataStoreKeeper({ ownerPid: Number(ownerPid), recordPath, token });
