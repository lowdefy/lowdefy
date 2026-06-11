#!/usr/bin/env node
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
import opener from 'opener';

import createDevLogger from './utils/createDevLogger.mjs';
import getViteBin from './utils/getViteBin.mjs';
import RESTART_EXIT_CODE from '../plugin/restartExitCode.mjs';

// The dev process is plain Vite — the lowdefy() plugin does the building and
// watching in-process. The supervisor's only job is respawning: exit 87 means
// the plugin requested a fresh Node process (stale native ESM cache for
// plugin packages, .env or auth changes); other non-zero exits are crashes
// and respawn with backoff; exit 0 stops.
const logger = createDevLogger({ name: 'lowdefy dev' });
const port = String(process.env.PORT ?? 3000);

let child = null;
let fatal = false;
let crashes = 0;
let stopping = false;
let opened = false;

function start() {
  child = spawn('node', [getViteBin(), '--port', port, '--strictPort'], {
    stdio: ['ignore', 'inherit', 'pipe'],
    env: process.env,
  });

  child.stderr.on('data', (data) => {
    data
      .toString('utf8')
      .split('\n')
      .forEach((line) => {
        if (!line) return;
        if (line.includes('is already in use')) {
          fatal = true;
          logger.error(
            `Port ${port} is already in use. Stop the other process or use a different port with --port.`
          );
          return;
        }
        logger.error(line);
      });
  });

  child.on('exit', (code, signal) => {
    if (stopping) {
      process.exit(0);
    }
    if (fatal) {
      process.exit(1);
    }
    if (code === RESTART_EXIT_CODE) {
      crashes = 0;
      logger.debug('Dev server requested restart.');
      start();
      return;
    }
    if (code === 0 || signal) {
      process.exit(code ?? 0);
    }
    crashes += 1;
    const delay = Math.min(1000 * 2 ** (crashes - 1), 10000);
    logger.error(`Dev server exited with code ${code}. Restarting in ${delay / 1000}s...`);
    setTimeout(start, delay);
  });

  child.on('error', (error) => {
    logger.error(error);
  });

  if (!opened && process.env.LOWDEFY_SERVER_DEV_OPEN_BROWSER === 'true') {
    opened = true;
    setTimeout(() => opener(`http://localhost:${port}`), 800);
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopping = true;
    if (child && !child.killed) {
      child.kill();
    }
    process.exit(0);
  });
}

start();
