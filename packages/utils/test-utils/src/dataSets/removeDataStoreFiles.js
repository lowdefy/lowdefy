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

import fs from 'node:fs';

// Kills each mongod of the store and removes its temporary database directory, synchronously, so
// it also runs from a process exit hook. A store already stopped with cleanup has no servers left.
function removeDataStoreFiles({ replSet }) {
  replSet.servers.forEach((server) => {
    const info = server.instanceInfo;
    if (info === undefined) return;
    info.instance.mongodProcess?.kill('SIGKILL');
    if (info.tmpDir !== undefined) {
      fs.rmSync(info.tmpDir, { recursive: true, force: true });
    }
  });
}

export default removeDataStoreFiles;
