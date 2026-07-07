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

import path from 'path';
import { spawn } from 'child_process';

// Optional mobile client lane — enabled by `lowdefy mobile dev` via env flag.
// Runs the @lowdefy/mobile-client Vite dev server on a second port, with
// /api proxied to this dev server (see the mobile client's vite.config.js).
// Spawned by the manager so restarts and shutdown ride the existing lifecycle.
function startMobileClient(context) {
  if (process.env.LOWDEFY_SERVER_DEV_MOBILE !== 'true') {
    return;
  }
  if (context.mobileClient && !context.mobileClient.killed) {
    context.mobileClient.kill();
    context.mobileClient = null;
  }

  const mobileDirectory = path.resolve(
    process.env.LOWDEFY_DIRECTORY_MOBILE ?? path.join(context.directories.server, '../mobile')
  );
  const port = process.env.LOWDEFY_MOBILE_PORT ?? '3001';

  // Run the mobile package's own vite (pnpm run dev) so its config and vite
  // version apply. --host exposes the LAN address for on-device live reload.
  const mobileClient = spawn(
    context.packageManagerCmd,
    ['run', 'dev', '--port', String(port), '--strictPort', '--host'],
    {
      cwd: mobileDirectory,
      stdio: ['ignore', 'inherit', 'pipe'],
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        LOWDEFY_DIRECTORY_BUILD: context.directories.build,
        LOWDEFY_MOBILE_API_PORT: String(context.options.port),
        PORT: String(port),
      },
    }
  );

  mobileClient.stderr.on('data', (data) => {
    data
      .toString('utf8')
      .split('\n')
      .forEach((line) => {
        if (line) context.logger.error(line);
      });
  });

  context.logger.debug(`Started mobile client dev server with pid ${mobileClient.pid}.`);
  context.logger.info(`Mobile client running at http://localhost:${port}`);
  mobileClient.on('exit', (code, signal) => {
    context.logger.debug(
      `mobileClient exit ${mobileClient.pid}, signal: ${signal}, code: ${code}`
    );
  });
  mobileClient.on('error', (error) => {
    context.logger.error(error);
  });
  context.mobileClient = mobileClient;
}

export default startMobileClient;
