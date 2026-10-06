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
  Prepare an untracked copy of the production server for a block e2e app, so
  `lowdefy build --server-directory <copy>` never writes to tracked files.

  Usage (the Playwright config from @lowdefy/block-dev-e2e runs this):
    node scripts/prepare-e2e-server.mjs --config-directory <app> --server-directory _server/e2e/<package>

  How it works:
    1. Copies packages/servers/server into the target, keeping an existing
       node_modules and lockfile so the CLI can skip an unchanged install, and
       pins the monorepo's pnpm version
    2. Scans monorepo packages, rewrites @lowdefy/* deps to link: paths
    3. Handles workspace:* plugins from the app's lowdefy.yaml
    4. Writes an isolated pnpm workspace, so installs never touch the monorepo
       lockfile

  The monorepo must already be built: the CLI then installs, builds and starts
  the app from the copy.
*/

import fs from 'node:fs';
import path from 'node:path';

import parse, { REPO_ROOT } from './lib/parseArgs.mjs';
import copyServer from './lib/copyServer.mjs';
import scanPackages from './lib/scanPackages.mjs';
import rewriteDeps from './lib/rewriteDeps.mjs';
import addPlugins from './lib/addPlugins.mjs';
import createWorkspace from './lib/createWorkspace.mjs';

const SERVER_DIR = path.join(REPO_ROOT, 'packages/servers/server');
const E2E_SERVERS_DIR = path.join(REPO_ROOT, '_server/e2e');

const {
  configDirectory,
  logLevel,
  values: args,
} = parse({
  'server-directory': { type: 'string' },
});

if (typeof args['server-directory'] !== 'string') {
  throw new Error('prepare-e2e-server requires --server-directory.');
}
const serverDir = path.resolve(args['server-directory']);
// The target is cleared on every run, so it may only be a directory of _server/e2e/.
if (path.dirname(serverDir) !== E2E_SERVERS_DIR) {
  throw new Error(
    `--server-directory must be a directory in ${E2E_SERVERS_DIR}. Received ${serverDir}.`
  );
}

const { createCliLogger } = await import('../packages/utils/logger/dist/cli/index.js');
const logger = createCliLogger({ logLevel });

copyServer({
  sourceDir: SERVER_DIR,
  targetDir: serverDir,
  keep: ['node_modules', 'pnpm-lock.yaml'],
});
// Pin the monorepo's pnpm: the copy keeps its install between runs, and another pnpm
// version (a global one, when Playwright runs outside `pnpm e2e`) refuses to reuse that
// install without a TTY.
const { packageManager } = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')
);
const packageJsonPath = path.join(serverDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.packageManager = packageManager;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
// The CLI resets package.json from package.original.json before every build. Take it
// from the tracked package.json, as the server's own build script does, so a stale
// package.original.json in the source can't change the copy's dependencies.
fs.copyFileSync(packageJsonPath, path.join(serverDir, 'package.original.json'));

const packageMap = scanPackages(REPO_ROOT);
rewriteDeps({ sourceDir: SERVER_DIR, targetDir: serverDir, packageMap });
addPlugins({ configDirectory, targetDir: serverDir, logger });
createWorkspace({ targetDir: serverDir, configDirectory });

logger.info(`Prepared e2e server at ${serverDir}.`);
