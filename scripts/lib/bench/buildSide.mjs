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

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import createBuildEnv from './createBuildEnv.mjs';

// Runs one side's own CLI build on a server prepareServer made: installs, every
// config pass, no client build. Callable any number of times on the same
// server. stdout and stderr go to one log file, in the order written.
// Resolves to { ok, exitCode, logFile, output, wallMs }.
async function buildSide({
  configDirectory,
  env = {},
  logFile,
  repoRoot,
  server,
  serverDirectory,
}) {
  const cliPath = path.join(repoRoot, 'packages/cli/dist/index.js');
  const args = [
    cliPath,
    'build',
    '--config-directory',
    configDirectory,
    '--server-directory',
    serverDirectory,
    '--no-client-build',
    '--disable-telemetry',
  ];
  if (server === 'e2e') {
    args.push('--server', 'e2e');
  }
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  const fd = fs.openSync(logFile, 'w');
  const started = performance.now();
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: configDirectory,
      env: { ...createBuildEnv(), ...env },
      stdio: ['ignore', fd, fd],
    });
    child.on('error', reject);
    child.on('close', resolve);
  });
  const wallMs = performance.now() - started;
  fs.closeSync(fd);
  return {
    ok: exitCode === 0,
    exitCode,
    logFile,
    output: fs.readFileSync(logFile, 'utf8'),
    wallMs,
  };
}

export default buildSide;
