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

import crypto from 'crypto';
import os from 'os';
import path from 'path';

// Unix socket paths are limited to about 104 bytes.
const MAX_SOCKET_PATH = 100;

function getSocketPath({ hubDirectory }) {
  const id = crypto.createHash('sha256').update(hubDirectory).digest('hex').slice(0, 16);
  if (process.platform === 'win32') {
    return `\\\\.\\pipe\\lowdefy-hub-${id}`;
  }
  const socketPath = path.join(hubDirectory, 'hub.sock');
  if (Buffer.byteLength(socketPath) <= MAX_SOCKET_PATH) {
    return socketPath;
  }
  // A deep home directory: fall back to the per-user temp directory.
  return path.join(os.tmpdir(), `lowdefy-hub-${id}.sock`);
}

// LOWDEFY_HOME moves all per-user state, so tests and side-by-side hubs never
// touch the developer's real one.
function getHubPaths() {
  const home = process.env.LOWDEFY_HOME ?? path.join(os.homedir(), '.lowdefy');
  const hubDirectory = path.join(home, 'hub');
  return {
    hubDirectory,
    logPath: path.join(hubDirectory, 'hub.log'),
    registryPath: path.join(hubDirectory, 'registry.json'),
    socketPath: getSocketPath({ hubDirectory }),
  };
}

export default getHubPaths;
