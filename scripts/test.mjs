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
  Run `lowdefy test` against the local monorepo.

  An app with `lowdefy: local` in lowdefy.yaml has no version for the CLI to
  fetch from npm, so `lowdefy test` cannot populate a server directory of its
  own. This script prepares one the way scripts/dev.mjs prepares _server/dev,
  then hands it to the test command with --dev-directory.

  Usage:
    pnpm app:test                                          # app/ with defaults
    pnpm app:test --filter 'layout'                        # one test by name
    pnpm app:test --coverage                               # journey coverage
    pnpm app:test --config-directory /path/to/app          # external app
    pnpm app:test --skip-build                             # skip monorepo build
    pnpm app:test --skip-prepare                           # reuse _server/test as is

  How it works:
    1. Builds the monorepo (pnpm build:turbo)
    2. Copies server-dev to _server/test/
    3. Scans monorepo packages, rewrites @lowdefy/* deps to link: paths
    4. Handles workspace:* plugins from external pnpm monorepos
    5. Runs pnpm install in the isolated copy
    6. Runs the CLI's test command against that directory

  Unknown flags are forwarded to `lowdefy test`, so --update, --url and the rest
  of the command's options work here too.
*/

import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import parse, { REPO_ROOT } from './lib/parseArgs.mjs';
import copyServer from './lib/copyServer.mjs';
import scanPackages from './lib/scanPackages.mjs';
import rewriteDeps from './lib/rewriteDeps.mjs';
import addPlugins from './lib/addPlugins.mjs';
import addAppDependencies from './lib/addAppDependencies.mjs';
import createWorkspace from './lib/createWorkspace.mjs';

const SERVER_DEV_DIR = path.join(REPO_ROOT, 'packages/servers/server-dev');
const CLI_BIN = path.join(REPO_ROOT, 'packages/cli/dist/index.js');

// The runner's server shares the machine with `pnpm app:dev` (3111) and with
// whatever the developer has on 3000. findAvailablePort in the CLI walks up
// from here if 3113 is taken.
const DEFAULT_PORT = '3113';

// Options this script consumes; everything else goes to `lowdefy test`.
const SCRIPT_ONLY_FLAGS = new Set([
  'config-directory',
  'log-level',
  'port',
  'skip-build',
  'skip-prepare',
]);

// -- Arg parsing --

const {
  configDirectory,
  logLevel,
  skipBuild,
  values: args,
} = parse({
  port: { type: 'string', default: DEFAULT_PORT },
  'skip-prepare': { type: 'boolean', default: false },
});

const port = args['port'];
const skipPrepare = args['skip-prepare'];
const testDir = path.join(REPO_ROOT, '_server/test');

console.log('Lowdefy test');
console.log(`  Config directory: ${configDirectory}`);
console.log(`  Test directory:   ${testDir}`);
console.log(`  Port:             ${port}`);
console.log(`  Log level:        ${logLevel}`);
console.log('');

// -- Step 1: Build monorepo --

if (!skipBuild) {
  console.log('Building monorepo...');
  execSync('pnpm build:turbo', { cwd: REPO_ROOT, stdio: 'inherit' });
  console.log('');
}

// -- Step 2: Import CLI logger (needs dist from build) --

const { createCliLogger } = await import('../packages/utils/logger/dist/cli/index.js');
const logger = createCliLogger({ logLevel });

// -- Steps 3-8: Prepare the isolated server the runner boots --

const prepared = fs.existsSync(path.join(testDir, 'node_modules'));
if (skipPrepare && !prepared) {
  throw new Error(`--skip-prepare was passed but ${testDir} holds no installed server.`);
}

if (skipPrepare) {
  logger.info(`Reusing the server in ${testDir}.`);
} else {
  logger.info({ spin: 'start' }, 'Copying server-dev to test directory...');
  copyServer({ sourceDir: SERVER_DEV_DIR, targetDir: testDir });
  logger.info({ spin: 'succeed' }, 'Copied server-dev to test directory.');

  logger.info({ spin: 'start' }, 'Scanning monorepo packages...');
  const packageMap = scanPackages(REPO_ROOT);
  logger.info({ spin: 'succeed' }, `Found ${packageMap.size} @lowdefy/* packages.`);

  logger.info({ spin: 'start' }, 'Rewriting package.json files with link: paths...');
  rewriteDeps({ targetDir: testDir, packageMap, repoRoot: REPO_ROOT });
  logger.info({ spin: 'succeed' }, 'Rewrote package.json files.');

  addPlugins({ configDirectory, targetDir: testDir, logger });
  addAppDependencies({ configDirectory, targetDir: testDir, logger });

  logger.info({ spin: 'start' }, 'Creating isolated pnpm workspace...');
  createWorkspace({ targetDir: testDir });
  logger.info({ spin: 'succeed' }, 'Created isolated pnpm workspace.');

  logger.info({ spin: 'start' }, 'Installing dependencies...');
  execSync('pnpm install --no-lockfile', { cwd: testDir, stdio: 'inherit' });
  logger.info({ spin: 'succeed' }, 'Dependencies installed.');
}

// -- Step 9: Run the CLI's test command against that server --

// process.argv minus this script's own flags, so `pnpm app:test --filter x`
// reaches the command unchanged.
function forwardedArgs() {
  const forwarded = [];
  const rest = process.argv.slice(2);
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (match === null) {
      forwarded.push(arg);
      continue;
    }
    const [, name, inlineValue] = match;
    if (!SCRIPT_ONLY_FLAGS.has(name)) {
      forwarded.push(arg);
      continue;
    }
    // A space-separated value belongs to the flag this script consumed.
    if (inlineValue === undefined && name !== 'skip-build' && name !== 'skip-prepare') {
      index += 1;
    }
  }
  return forwarded;
}

const cliArgs = [
  CLI_BIN,
  'test',
  '--config-directory',
  configDirectory,
  '--dev-directory',
  testDir,
  '--log-level',
  logLevel,
  '--port',
  port,
  ...forwardedArgs(),
];

const child = spawn('node', cliArgs, { cwd: REPO_ROOT, stdio: 'inherit' });

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
