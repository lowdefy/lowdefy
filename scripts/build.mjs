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
  Build a Lowdefy app for production against the local monorepo.

  Usage:
    pnpm app:build                                                   # app/ with defaults
    pnpm app:build --config-directory /path/to/app --log-level debug # external app
    pnpm app:build --skip-build                                      # skip monorepo build

  How it works:
    1. Builds the monorepo (pnpm build:turbo)
    2. Copies server to _server/prod/, patches next.config.js
    3. Scans monorepo packages, rewrites @lowdefy/* deps to link: paths
    4. Handles workspace:* plugins from external pnpm monorepos
    5. Runs pnpm install in the isolated copy
    6. Runs lowdefy build (generates build/ artifacts)
    7. Runs pnpm install again (build may add plugin deps)
    8. Runs next build
*/

import { execSync } from 'node:child_process';
import path from 'node:path';

import parse, { REPO_ROOT } from './lib/parseArgs.mjs';
import copyServer from './lib/copyServer.mjs';
import patchNextConfig from './lib/patchNextConfig.mjs';
import scanPackages from './lib/scanPackages.mjs';
import rewriteDeps from './lib/rewriteDeps.mjs';
import addPlugins from './lib/addPlugins.mjs';
import createWorkspace from './lib/createWorkspace.mjs';

const SERVER_DIR = path.join(REPO_ROOT, 'packages/servers/server');

// -- Arg parsing --

const { configDirectory, logLevel, skipBuild, values: args } = parse({
  'ref-resolver': { type: 'string' },
});

const refResolver = args['ref-resolver'];
const prodDir = path.join(REPO_ROOT, '_server/prod');

console.log('Lowdefy build');
console.log(`  Config directory: ${configDirectory}`);
console.log(`  Prod directory:   ${prodDir}`);
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

// -- Step 3: Copy server to isolated location --

logger.info({ spin: 'start' }, 'Copying server to prod directory...');
copyServer({ sourceDir: SERVER_DIR, targetDir: prodDir });
patchNextConfig({ targetDir: prodDir });
logger.info({ spin: 'succeed' }, 'Copied server to prod directory.');

// -- Step 4: Build @lowdefy/* package map --

logger.info({ spin: 'start' }, 'Scanning monorepo packages...');
const packageMap = scanPackages(REPO_ROOT);
logger.info({ spin: 'succeed' }, `Found ${packageMap.size} @lowdefy/* packages.`);

// -- Step 5: Rewrite deps + add pnpm.overrides --

logger.info({ spin: 'start' }, 'Rewriting package.json files with link: paths...');
rewriteDeps({ targetDir: prodDir, packageMap, repoRoot: REPO_ROOT });
logger.info({ spin: 'succeed' }, 'Rewrote package.json files.');

// -- Step 6: Handle custom plugins from lowdefy.yaml --

addPlugins({ configDirectory, targetDir: prodDir, logger });

// -- Step 7: Create isolated workspace --

logger.info({ spin: 'start' }, 'Creating isolated pnpm workspace...');
createWorkspace({ targetDir: prodDir });
logger.info({ spin: 'succeed' }, 'Created isolated pnpm workspace.');

// -- Step 8: Install dependencies --

logger.info({ spin: 'start' }, 'Installing dependencies...');
execSync('pnpm install --no-lockfile', { cwd: prodDir, stdio: 'inherit' });
logger.info({ spin: 'succeed' }, 'Dependencies installed.');

// -- Step 9: Run lowdefy build --

logger.info({ spin: 'start' }, 'Running lowdefy build...');
const buildEnv = {
  ...process.env,
  LOWDEFY_DIRECTORY_CONFIG: configDirectory,
  LOWDEFY_LOG_LEVEL: logLevel,
};
if (refResolver) {
  buildEnv.LOWDEFY_BUILD_REF_RESOLVER = refResolver;
}
execSync('pnpm run build:lowdefy', { cwd: prodDir, stdio: 'inherit', env: buildEnv });
logger.info({ spin: 'succeed' }, 'Lowdefy build complete.');

// -- Step 10: Install dependencies again (build may have added plugin deps) --

logger.info({ spin: 'start' }, 'Installing dependencies (post-build)...');
execSync('pnpm install --no-lockfile', { cwd: prodDir, stdio: 'inherit' });
logger.info({ spin: 'succeed' }, 'Dependencies installed.');

// -- Step 11: Run next build --

logger.info({ spin: 'start' }, 'Running next build...');
execSync('pnpm run build:next', { cwd: prodDir, stdio: 'inherit', env: buildEnv });
logger.info({ spin: 'succeed' }, 'Next build complete.');

console.log('');
console.log('Build complete. Run `pnpm app:start` to start the production server.');
