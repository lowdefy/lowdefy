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
  Run a Lowdefy app against the local monorepo without dirtying packages/.

  Usage:
    pnpm dev                                                    # app/ with defaults
    pnpm dev --config-directory /path/to/app --log-level debug  # external app
    pnpm dev --no-open --port 3001                              # custom port, no browser

  How it works:
    1. Builds the monorepo (pnpm build:turbo)
    2. Imports CLI logger from built dist (for spinners and formatted output)
    3. Copies server-dev to _server/dev/, patches next.config.js
    4. Scans monorepo packages, rewrites @lowdefy/* deps to link: paths
    5. Handles workspace:* plugins from external pnpm monorepos
    6. Runs pnpm install in the isolated copy
    7. Starts the dev server manager (node manager/run.mjs)
*/

import { execSync, spawn } from 'node:child_process';
import path from 'node:path';

import parse, { REPO_ROOT } from './lib/parseArgs.mjs';
import copyServer from './lib/copyServer.mjs';
import patchNextConfig from './lib/patchNextConfig.mjs';
import scanPackages from './lib/scanPackages.mjs';
import rewriteDeps from './lib/rewriteDeps.mjs';
import addPlugins, { readLowdefyYaml } from './lib/addPlugins.mjs';
import createWorkspace from './lib/createWorkspace.mjs';

const SERVER_DEV_DIR = path.join(REPO_ROOT, 'packages/servers/server-dev');

// -- Arg parsing --

const { configDirectory, logLevel, skipBuild, values: args } = parse({
  open: { type: 'boolean', default: false },
  port: { type: 'string', default: '3000' },
  watch: { type: 'string', multiple: true, default: [] },
  'watch-ignore': { type: 'string', multiple: true, default: [] },
});

const openBrowser = args['open'];
const port = args['port'];
const watchPaths = args['watch'];
const watchIgnorePaths = args['watch-ignore'];

const devDir = path.join(REPO_ROOT, '_server/dev');

console.log('Lowdefy dev');
console.log(`  Config directory: ${configDirectory}`);
console.log(`  Dev directory:    ${devDir}`);
console.log(`  Port:             ${port}`);
console.log(`  Log level:        ${logLevel}`);
console.log(`  Open browser:     ${openBrowser}`);
console.log('');

// -- Step 1: Build monorepo --

if (!skipBuild) {
  console.log('Building monorepo...');
  execSync('pnpm build:turbo', { cwd: REPO_ROOT, stdio: 'inherit' });
  console.log('');
}

// -- Step 2: Import CLI logger (needs dist from build) --

// Dynamic import: @lowdefy/logger is a workspace package whose dist/ is built by
// pnpm build:turbo above. The repo root can't resolve it by package name, so we
// import directly from the dist path.
const { createCliLogger, createStdOutLineHandler } = await import(
  '../packages/utils/logger/dist/cli/index.js'
);

const logger = createCliLogger({ logLevel });
const context = { logger };
const stdOutLineHandler = createStdOutLineHandler({ context });

// -- Step 3: Copy server-dev to isolated location --

logger.info({ spin: 'start' }, 'Copying server-dev to dev directory...');
copyServer({ sourceDir: SERVER_DEV_DIR, targetDir: devDir });
patchNextConfig({ targetDir: devDir });
logger.info({ spin: 'succeed' }, 'Copied server-dev to dev directory.');

// -- Step 4: Build @lowdefy/* package map --

logger.info({ spin: 'start' }, 'Scanning monorepo packages...');
const packageMap = scanPackages(REPO_ROOT);
logger.info({ spin: 'succeed' }, `Found ${packageMap.size} @lowdefy/* packages.`);

// -- Step 5: Rewrite deps + add pnpm.overrides --

logger.info({ spin: 'start' }, 'Rewriting package.json files with link: paths...');
rewriteDeps({ targetDir: devDir, packageMap, repoRoot: REPO_ROOT });
logger.info({ spin: 'succeed' }, 'Rewrote package.json files.');

// -- Step 6: Handle custom plugins from lowdefy.yaml --

addPlugins({ configDirectory, targetDir: devDir, logger });

// -- Step 7: Create isolated workspace --

logger.info({ spin: 'start' }, 'Creating isolated pnpm workspace...');
createWorkspace({ targetDir: devDir });
logger.info({ spin: 'succeed' }, 'Created isolated pnpm workspace.');

// -- Step 8: Install dependencies --

logger.info({ spin: 'start' }, 'Installing dependencies...');
execSync('pnpm install --no-lockfile', { cwd: devDir, stdio: 'inherit' });
logger.info({ spin: 'succeed' }, 'Dependencies installed.');

// -- Step 9: Start the dev server --

logger.info({ spin: 'start' }, 'Starting dev server...');

const env = {
  ...process.env,
  LOWDEFY_DIRECTORY_CONFIG: configDirectory,
  LOWDEFY_LOG_LEVEL: logLevel,
  LOWDEFY_SERVER_DEV_OPEN_BROWSER: openBrowser ? 'true' : 'false',
  PORT: port,
};

// Merge CLI --watch/--watch-ignore with cli.watch/cli.watchIgnore from lowdefy.yaml
const yamlForCli = readLowdefyYaml(configDirectory);
if (yamlForCli) {
  const cliMatch = yamlForCli.match(/^cli:\s*\n((?:[ \t]+.*\n)*)/m);
  if (cliMatch) {
    const cliBlock = cliMatch[1];
    const watchMatch = cliBlock.match(/watch:\s*\n((?:\s+-\s+.+\n)*)/);
    const watchIgnoreMatch = cliBlock.match(/watchIgnore:\s*\n((?:\s+-\s+.+\n)*)/);
    if (watchMatch) {
      for (const line of watchMatch[1].split('\n')) {
        const m = line.match(/^\s+-\s+(.+)/);
        if (m) watchPaths.push(m[1].trim());
      }
    }
    if (watchIgnoreMatch) {
      for (const line of watchIgnoreMatch[1].split('\n')) {
        const m = line.match(/^\s+-\s+(.+)/);
        if (m) watchIgnorePaths.push(m[1].trim());
      }
    }
  }
}

if (watchPaths.length > 0) {
  env.LOWDEFY_SERVER_DEV_WATCH = JSON.stringify(watchPaths);
}
if (watchIgnorePaths.length > 0) {
  env.LOWDEFY_SERVER_DEV_WATCH_IGNORE = JSON.stringify(watchIgnorePaths);
}

const child = spawn('node', ['manager/run.mjs'], {
  cwd: devDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  env,
});

function createLineHandler(handler) {
  let buffer = '';
  return (data) => {
    const text = buffer + data.toString('utf8');
    const lines = text.split('\n');
    buffer = lines.pop();
    lines.forEach((line) => {
      if (line) handler(line);
    });
  };
}

child.stdout.on('data', createLineHandler(stdOutLineHandler));
child.stderr.on('data', createLineHandler(stdOutLineHandler));

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

// Forward signals to child
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
