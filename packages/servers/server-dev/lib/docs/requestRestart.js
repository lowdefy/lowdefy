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
import path from 'node:path';

// The manager's child is the Vite process, not this Hono app, so there is no
// IPC channel back to the manager. Like build/reload and build/invalidatePages,
// a sentinel file in the build directory is the channel: the manager watches
// for .restart and restarts the server when it appears.
function requestRestart({ reason }) {
  const filePath = path.join(process.cwd(), 'build', '.restart');
  fs.writeFileSync(filePath, JSON.stringify({ requestedAt: new Date().toISOString(), reason }));
  return { requested: true, reason };
}

export default requestRestart;
