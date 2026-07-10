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
import { type } from '@lowdefy/helpers';

const defaultCommand = 'npx lowdefy dev';

// Prefer a package.json script that already runs "lowdefy dev" over the npx fallback,
// using the package manager implied by the project's lockfile. Scripts come
// from the app's own package.json; the lockfile may live at the workspace
// root in a monorepo, so both directories are checked.
function getDevCommand({ configDirectory, projectDirectory = configDirectory }) {
  const packageJsonPath = path.join(configDirectory, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return defaultCommand;
  }

  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch {
    return defaultCommand;
  }

  const scripts = packageJson.scripts ?? {};
  const scriptName = Object.keys(scripts).find((name) => scripts[name].includes('lowdefy dev'));
  if (type.isNone(scriptName)) {
    return defaultCommand;
  }

  function lockfileExists(lockfileName) {
    return (
      fs.existsSync(path.join(configDirectory, lockfileName)) ||
      fs.existsSync(path.join(projectDirectory, lockfileName))
    );
  }

  if (lockfileExists('pnpm-lock.yaml')) {
    return `pnpm ${scriptName}`;
  }
  if (lockfileExists('yarn.lock')) {
    return `yarn ${scriptName}`;
  }
  return `npm run ${scriptName}`;
}

export default getDevCommand;
