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

/*
  Start a previously built Lowdefy production server from _server/prod/.

  Usage:
    pnpm app:start                                        # default port 3000
    pnpm app:start --port 8080                            # custom port
    pnpm app:start --server-directory _server/prod-other  # the copy build.mjs wrote there
*/

import { parseArgs } from 'node:util';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import ownedServerEnv from './lib/ownedServerEnv.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

// -- Arg parsing --

const { values: args } = parseArgs({
  options: {
    port: { type: 'string', default: '3000' },
    'log-level': { type: 'string', default: 'info' },
    'server-directory': { type: 'string', default: '_server/prod' },
  },
  strict: false,
});

const port = args['port'];
const logLevel = args['log-level'];
const prodDir = path.resolve(REPO_ROOT, args['server-directory']);

// -- Check build exists --

if (!fs.existsSync(path.join(prodDir, 'dist/client'))) {
  console.error(`Error: No production build found at ${path.join(prodDir, 'dist/client')}`);
  console.error('Run `node scripts/build.mjs` with the same --server-directory first.');
  process.exit(1);
}

// -- Start server --

console.log(`Starting production server on port ${port}...`);

// node itself, no pnpm between this script and the server. This script holds
// the server's stdin and never writes to it: the pipe closes when this script
// dies, however it dies, and the server exits on that.
const child = spawn(process.execPath, ['src/index.js'], {
  cwd: prodDir,
  stdio: ['pipe', 'inherit', 'inherit'],
  env: {
    ...process.env,
    ...ownedServerEnv(),
    PORT: port,
    LOWDEFY_LOG_LEVEL: logLevel,
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

// Forward signals to child
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
