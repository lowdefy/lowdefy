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

// What the CLI sets for a server it spawns (packages/cli/src/utils/spawnServer.js):
// the server exits when this script's stdin pipe to it closes, and records
// itself in the machine-wide server registry under LOWDEFY_HOME.
function ownedServerEnv() {
  const home = process.env.LOWDEFY_HOME ?? path.join(os.homedir(), '.lowdefy');
  return {
    LOWDEFY_EXIT_ON_STDIN_CLOSE: '1',
    LOWDEFY_SERVER_REGISTRY_DIR: path.join(home, 'servers'),
  };
}

export default ownedServerEnv;
