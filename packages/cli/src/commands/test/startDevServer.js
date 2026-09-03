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

import axios from 'axios';
import { findAvailablePort, spawnProcess } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import addCustomPluginsAsDeps from '../../utils/addCustomPluginsAsDeps.js';
import ensurePnpmWorkspaceYaml from '../../utils/ensurePnpmWorkspaceYaml.js';
import getServer from '../../utils/getServer.js';
import getTestServerDirectory from './getTestServerDirectory.js';
import installServer from '../../utils/installServer.js';

const CAPTURED_LINES = 40;

// The runner's server is ephemeral and shares the machine with the developer's
// own `lowdefy dev`, so it never reaches for 3000 unless --port asked for it.
function randomHighPort() {
  return 40000 + Math.floor(Math.random() * 20000);
}

function getStartPort({ context }) {
  const port = context.commandLineOptions?.port;
  if (type.isNone(port)) {
    return randomHighPort();
  }
  return Number(port);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerReady({ url }) {
  try {
    await axios.get(`${url}/api/ping`, { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }
  return new Promise((resolve) => child.once('exit', resolve));
}

// Boots @lowdefy/server-dev headless in .lowdefy/test, exactly as `lowdefy dev` does but
// without opening a browser, and resolves once GET /api/ping answers. `env` is merged
// into the child's environment (the request suite passes its connection overrides).
async function startDevServer({ context, env = {}, pollIntervalMs = 250, bootTimeoutMs = 120000 }) {
  const directory = getTestServerDirectory({ context });
  const port = await findAvailablePort({ port: getStartPort({ context }) });
  await getServer({ context, packageName: '@lowdefy/server-dev', directory });
  await addCustomPluginsAsDeps({ context, directory });
  await ensurePnpmWorkspaceYaml({ context, directory });
  await installServer({ context, directory });

  const capturedLines = [];
  function captureLine(line) {
    capturedLines.push(String(line));
    if (capturedLines.length > CAPTURED_LINES) {
      capturedLines.shift();
    }
    context.logger.debug(String(line));
  }

  context.logger.info(`Starting development server on port ${port}.`);
  const child = spawnProcess({
    args: ['run', 'start'],
    command: context.pnpmCmd,
    returnProcess: true,
    stdOutLineHandler: captureLine,
    processOptions: {
      cwd: directory,
      // `pnpm run start` is a chain of processes (pnpm launcher -> pnpm -> manager -> vite).
      // A SIGTERM to the launcher alone orphans the rest, so the child gets its own process
      // group and stop() signals the whole group.
      detached: process.platform !== 'win32',
      // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        LOWDEFY_BUILD_REF_RESOLVER: context.options.refResolver,
        LOWDEFY_DIRECTORY_CONFIG: context.directories.config,
        LOWDEFY_LOG_LEVEL: context.options.logLevel,
        LOWDEFY_SERVER_DEV_OPEN_BROWSER: false,
        // Write requests are refused by default, and the opt-in belongs to a
        // developer's own session, not to committed config. A server this
        // runner started is scoped to the run, so it carries the allowance in
        // its environment and the app's lowdefy.yaml stays fail-closed.
        LOWDEFY_TEST_RUN: '1',
        PORT: port,
        ...env,
      },
    },
  });

  const url = `http://localhost:${port}`;
  async function stop() {
    if (child.exitCode !== null || child.signalCode !== null) {
      return;
    }
    if (process.platform === 'win32') {
      child.kill('SIGTERM');
    } else {
      process.kill(-child.pid, 'SIGTERM');
    }
    await waitForExit(child);
  }

  const deadline = Date.now() + bootTimeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      const error = new Error(
        `Development server exited with code ${child.exitCode} before it was ready.`
      );
      error.serverOutput = capturedLines;
      throw error;
    }
    if (await isServerReady({ url })) {
      return { url, port, stop };
    }
    await sleep(pollIntervalMs);
  }
  await stop();
  const error = new Error(
    `Development server did not answer GET /api/ping within ${bootTimeoutMs}ms.`
  );
  error.serverOutput = capturedLines;
  throw error;
}

export default startDevServer;
