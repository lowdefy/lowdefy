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

import readProcessCwds from './readProcessCwds.js';
import readProcessTable from './readProcessTable.js';
import selectLegacyOrphans from './selectLegacyOrphans.js';

const SERVER_COMMAND = /(^|\/)node(\.exe)? (src\/index\.js|manager\/run\.mjs)$/;
const VITE_COMMAND = /(^|\/)node(\.exe)? \S*\/vite\/bin\/vite\.js --host 127\.0\.0\.1 /;

// Lowdefy servers left behind before servers recorded themselves in the registry, and Vite
// children of dev managers that are gone, found from the process table. Only `lowdefy hub
// prune`, run by a person and shown first, acts on these: the rules cannot tell a dead
// spawner from nohup. macOS and Linux only.
function findLegacyOrphans({ registeredPids, hubPids, platform = process.platform }) {
  if (platform !== 'darwin' && platform !== 'linux') {
    return [];
  }
  const processes = readProcessTable();
  const serverPids = processes
    .filter((entry) => SERVER_COMMAND.test(entry.command) || VITE_COMMAND.test(entry.command))
    .map((entry) => entry.pid);
  const cwds = readProcessCwds({ pids: serverPids, platform });
  return selectLegacyOrphans({ processes, cwds, registeredPids, hubPids, platform });
}

export default findLegacyOrphans;
