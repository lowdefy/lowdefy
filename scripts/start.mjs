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
    pnpm app:start                    # default port 3000
    pnpm app:start --port 8080        # custom port
*/

import { parseArgs } from 'node:util';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const prodDir = path.join(REPO_ROOT, '_server/prod');

// -- Arg parsing --

const { values: args } = parseArgs({
  options: {
    port: { type: 'string', default: '3000' },
    'log-level': { type: 'string', default: 'info' },
  },
  strict: false,
});

const port = args['port'];
const logLevel = args['log-level'];

// -- Check build exists --

if (!fs.existsSync(path.join(prodDir, '.next'))) {
  console.error('Error: No production build found at _server/prod/.next');
  console.error('Run `pnpm app:build` first.');
  process.exit(1);
}

// -- Start server --

console.log(`Starting production server on port ${port}...`);

const child = spawn('pnpm', ['run', 'start'], {
  cwd: prodDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: port,
    LOWDEFY_LOG_LEVEL: logLevel,
  },
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

// Forward signals to child
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
