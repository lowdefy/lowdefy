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
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Runs `lowdefy hub serve` with this CLI, detached, so the hub outlives the
// agent session or tool call that needed it.
function startHubProcess({ paths }) {
  fs.mkdirSync(paths.hubDirectory, { recursive: true, mode: 0o700 });
  const logFd = fs.openSync(paths.logPath, 'a');
  const cliEntry = fileURLToPath(new URL('../../index.js', import.meta.url));
  const hub = spawn(process.execPath, [cliEntry, 'hub', 'serve'], {
    detached: true,
    env: process.env,
    stdio: ['ignore', logFd, logFd],
    windowsHide: true,
  });
  fs.closeSync(logFd);
  hub.unref();
}

export default startHubProcess;
