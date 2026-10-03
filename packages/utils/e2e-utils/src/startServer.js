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

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

import isPortAvailable from '@lowdefy/node-utils/isPortAvailable.js';

const READY_POLL_MS = 500;

function resolveLowdefyCommand({ appDir }) {
  const binName = process.platform === 'win32' ? 'lowdefy.cmd' : 'lowdefy';
  const localBin = path.join(appDir, 'node_modules', '.bin', binName);
  if (fs.existsSync(localBin)) {
    return { command: localBin, prefix: [] };
  }
  return { command: process.platform === 'win32' ? 'npx.cmd' : 'npx', prefix: ['lowdefy'] };
}

function hasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

function waitForExit({ child, timeoutMs }) {
  if (hasExited(child)) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve(true);
    });
  });
}

function runBuild({ appDir, lowdefy, env }) {
  return new Promise((resolve, reject) => {
    const build = spawn(lowdefy.command, [...lowdefy.prefix, 'build', '--server', 'e2e'], {
      cwd: appDir,
      env,
      stdio: 'inherit',
      // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high
      shell: process.platform === 'win32',
    });
    build.on('error', reject);
    build.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`lowdefy build exited with code ${code}.`));
        return;
      }
      resolve();
    });
  });
}

function signalGroup({ child, signal }) {
  try {
    if (process.platform === 'win32') {
      child.kill(signal);
    } else {
      // The CLI and the server it runs share the group startServer gave them.
      process.kill(-child.pid, signal);
    }
  } catch (error) {
    if (error.code !== 'ESRCH') {
      throw error;
    }
  }
}

async function isAnswering({ url }) {
  try {
    await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

// Starts a Lowdefy app's e2e server for a test harness (a vitest or Jest globalSetup, a rig
// script) and returns once it answers. The server is tied to this process: it stops when this
// process exits, however it exits (LOWDEFY_EXIT_WITH_PID), so a killed or timed-out run leaves
// nothing behind. Call stop() in teardown to stop it sooner.
async function startServer({
  appDir,
  port,
  env = {},
  build = true,
  timeoutMs = 180000,
  stopGraceMs = 10000,
}) {
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`startServer requires a port. Received ${JSON.stringify(port)}.`);
  }
  const absoluteAppDir = path.resolve(appDir);
  // An answer from a server already on the port would pass for this one.
  if (!(await isPortAvailable({ port }))) {
    throw new Error(`Port ${port} is already in use.`);
  }
  const lowdefy = resolveLowdefyCommand({ appDir: absoluteAppDir });
  const serverEnv = { ...process.env, ...env, LOWDEFY_EXIT_WITH_PID: String(process.pid) };
  if (build) {
    await runBuild({ appDir: absoluteAppDir, lowdefy, env: serverEnv });
  }

  const child = spawn(
    lowdefy.command,
    [...lowdefy.prefix, 'start', '--port', String(port), '--log-level', 'warn'],
    {
      cwd: absoluteAppDir,
      env: serverEnv,
      stdio: ['ignore', 'inherit', 'inherit'],
      // Its own process group, so stop() reaches the server under any wrapper (npx, the CLI).
      detached: process.platform !== 'win32',
      shell: process.platform === 'win32',
    }
  );

  let spawnError = null;
  child.on('error', (error) => {
    spawnError = error;
  });

  async function stop() {
    if (hasExited(child)) {
      return;
    }
    signalGroup({ child, signal: 'SIGTERM' });
    if (await waitForExit({ child, timeoutMs: stopGraceMs })) {
      return;
    }
    signalGroup({ child, signal: 'SIGKILL' });
    await waitForExit({ child, timeoutMs: stopGraceMs });
  }

  const url = `http://localhost:${port}`;
  const deadline = Date.now() + timeoutMs;
  try {
    while (Date.now() < deadline) {
      if (spawnError !== null) {
        throw spawnError;
      }
      if (hasExited(child)) {
        throw new Error(
          `lowdefy start exited with code ${child.exitCode} before the server was ready.`
        );
      }
      if (await isAnswering({ url })) {
        return { url, port, stop };
      }
      await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS));
    }
    throw new Error(`The server on port ${port} was not ready within ${timeoutMs}ms.`);
  } catch (error) {
    await stop();
    throw error;
  }
}

export default startServer;
