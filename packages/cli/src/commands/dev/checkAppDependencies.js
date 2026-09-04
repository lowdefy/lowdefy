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

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { ConfigError } from '@lowdefy/errors';
import { readFile } from '@lowdefy/node-utils';

import hasFilePlugins from '../../utils/hasFilePlugins.js';

// A package with no main entry, or one that does not export its package.json,
// still resolves one of the two specifiers, so both are tried before a name is
// reported missing.
function isInstalled({ requireFromApp, name }) {
  try {
    requireFromApp.resolve(name);
    return true;
  } catch (_) {
    // pass
  }
  try {
    requireFromApp.resolve(`${name}/package.json`);
    return true;
  } catch (error) {
    return error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED';
  }
}

// In dev a file plugin is loaded in place from the config directory — the
// browser gets it through Vite, the server through Node — so its bare imports
// resolve against the app's own node_modules, which only the developer's
// package manager fills. Merging the app's dependencies into the server is what
// production needs and does nothing for dev, so without this check the first
// page that uses the plugin fails with a bare "Cannot find module" from deep
// inside Vite, cached until the server is restarted.
async function checkAppDependencies({ context }) {
  const configDirectory = context.directories.config;
  if (!hasFilePlugins({ configDirectory })) return;
  const appPackageJsonPath = path.join(configDirectory, 'package.json');
  if (!fs.existsSync(appPackageJsonPath)) return;
  const names = Object.keys(JSON.parse(await readFile(appPackageJsonPath)).dependencies ?? {});
  if (names.length === 0) return;

  const requireFromApp = createRequire(appPackageJsonPath);
  const missing = names.filter((name) => !isInstalled({ requireFromApp, name }));
  if (missing.length === 0) return;

  throw new ConfigError(
    `The app's file plugins depend on ${missing.map((name) => `"${name}"`).join(', ')}, which ${
      missing.length === 1 ? 'is' : 'are'
    } not installed in the config directory. In development a file plugin is loaded from where you wrote it, so its dependencies must be installed there. Run your package manager's install (for example "pnpm install") in ${configDirectory}.`,
    { filePath: appPackageJsonPath }
  );
}

export default checkAppDependencies;
