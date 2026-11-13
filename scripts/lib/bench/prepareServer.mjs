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

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import addPlugins, { readLowdefyYaml } from '../addPlugins.mjs';
import copyServer from '../copyServer.mjs';
import createWorkspace from '../createWorkspace.mjs';
import { REPO_ROOT } from '../parseArgs.mjs';
import rewriteDeps from '../rewriteDeps.mjs';
import scanPackages from '../scanPackages.mjs';
import writeParentWorkspace from './writeParentWorkspace.mjs';

const YAML = createRequire(path.join(REPO_ROOT, 'packages/cli/package.json'))('yaml');

const serverPackageDirectories = {
  prod: 'packages/servers/server',
  e2e: 'packages/servers/server-e2e',
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

function readAppLowdefyVersion({ configDirectory }) {
  const content = readLowdefyYaml(configDirectory);
  if (content === null) {
    throw new Error(`No lowdefy.yaml found in ${configDirectory}.`);
  }
  return String(YAML.parse(content).lowdefy);
}

// Prepares one side's server: that side's server package and @lowdefy/*
// packages, set up by this checkout's scripts so the preparation never differs
// between the sides. The side's CLI then installs and builds it.
function prepareServer({ configDirectory, logger, repoRoot, server = 'prod', serverDirectory }) {
  const sourceDir = path.join(repoRoot, serverPackageDirectories[server]);

  // An existing install and lockfile are kept, so the CLI skips an install
  // whose inputs did not change.
  copyServer({ sourceDir, targetDir: serverDirectory, keep: ['node_modules', 'pnpm-lock.yaml'] });

  const packageJsonPath = path.join(serverDirectory, 'package.json');
  const packageJson = readJson(packageJsonPath);
  // The kept install only works with the pnpm that made it.
  packageJson.packageManager = readJson(path.join(REPO_ROOT, 'package.json')).packageManager;
  // The CLI keeps a server whose name and version match the app's Lowdefy
  // version (getServer), and fetches one from npm otherwise. An app on
  // "lowdefy: local" is never fetched for.
  const lowdefyVersion = readAppLowdefyVersion({ configDirectory });
  if (lowdefyVersion !== 'local') {
    packageJson.version = lowdefyVersion;
  }
  writeJson(packageJsonPath, packageJson);
  // The CLI resets package.json from package.original.json before every build.
  fs.copyFileSync(packageJsonPath, path.join(serverDirectory, 'package.original.json'));

  rewriteDeps({ sourceDir, targetDir: serverDirectory, packageMap: scanPackages(repoRoot) });
  addPlugins({ configDirectory, targetDir: serverDirectory, logger });
  createWorkspace({ targetDir: serverDirectory, configDirectory });
  writeParentWorkspace({ serverDirectory });
}

export default prepareServer;
