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

import { spawnProcess } from '@lowdefy/node-utils';

import getServerRegistryDirectory from './getServerRegistryDirectory.js';

const FORWARDED_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGHUP'];

// Starts a server package (src/index.js or manager/run.mjs) with node itself,
// not through `pnpm run start`: nothing sits between the CLI and the server,
// and no shell is needed on Windows either. The CLI owns the server it starts:
// - it holds the server's stdin pipe and never writes to it. The pipe closes
//   when the CLI dies, however it dies (SIGKILL included), and the server
//   shuts down on that (LOWDEFY_EXIT_ON_STDIN_CLOSE).
// - it forwards SIGINT, SIGTERM and SIGHUP, so a signal aimed at the CLI alone
//   (a test harness teardown, an agent's `kill <pid>`) stops the server too.
// - it tells the server where to record itself (the server registry), which
//   `lowdefy hub ps|prune` reads.
// With returnProcess, the caller manages the child's lifetime itself.
function spawnServer({
  directory,
  entry,
  env,
  detached = false,
  returnProcess,
  stdOutLineHandler,
}) {
  const child = spawnProcess({
    command: process.execPath,
    args: [entry],
    returnProcess: true,
    stdOutLineHandler,
    processOptions: {
      cwd: directory,
      detached,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...env,
        LOWDEFY_EXIT_ON_STDIN_CLOSE: '1',
        LOWDEFY_SERVER_REGISTRY_DIR: getServerRegistryDirectory(),
      },
    },
  });

  if (returnProcess) {
    return child;
  }

  function forward(signal) {
    child.kill(signal);
  }
  FORWARDED_SIGNALS.forEach((signal) => process.on(signal, forward));

  return new Promise((resolve, reject) => {
    child.on('error', (error) => {
      stdOutLineHandler(error);
    });
    child.on('exit', (code, signal) => {
      FORWARDED_SIGNALS.forEach((name) => process.removeListener(name, forward));
      if (code !== 0) {
        reject(new Error(`Server exited with ${signal ? `signal ${signal}` : `code ${code}`}.`));
        return;
      }
      resolve();
    });
  });
}

export default spawnServer;
