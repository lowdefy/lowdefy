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

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import hasFilePlugins from './hasFilePlugins.mjs';

// In dev a file plugin is loaded in place from the config directory — the
// browser gets it through Vite, the server through Node — so its bare imports
// resolve against the app's own node_modules. addAppDependencies merges the
// same dependencies into the copied server, which is what production needs and
// does nothing for dev. `lowdefy dev` tells the user to install them; these
// scripts are the repo's own tooling and install them.
//
// --ignore-workspace keeps the install local to the app: the app directory sits
// outside the packages/* globs in pnpm-workspace.yaml, so the root lockfile and
// node_modules are untouched and the app gets a lockfile of its own.
function installAppDependencies({ configDirectory, logger }) {
  if (!hasFilePlugins({ configDirectory })) return;
  const appPackageJsonPath = path.join(configDirectory, 'package.json');
  if (!fs.existsSync(appPackageJsonPath)) return;
  const dependencies = JSON.parse(fs.readFileSync(appPackageJsonPath, 'utf8')).dependencies ?? {};
  if (Object.keys(dependencies).length === 0) return;

  logger.info({ spin: 'start' }, 'Installing app dependencies for file plugins...');
  execSync('pnpm install --ignore-workspace --prefer-offline', {
    cwd: configDirectory,
    stdio: 'inherit',
  });
  logger.info({ spin: 'succeed' }, 'Installed app dependencies for file plugins.');
}

export default installAppDependencies;
