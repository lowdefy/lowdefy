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
import path from 'node:path';
import YAML from 'yaml';

const PNPM_PATTERN = /^pnpm@(.+)$/;

// The pnpm version that installed the shell project, as pnpm records it in
// node_modules/.modules.yaml ("packageManager": "pnpm@10.33.0"). A dry run
// before the first install has none.
function readShellPnpmVersion({ projectDirectory }) {
  const modulesPath = path.join(projectDirectory, 'node_modules', '.modules.yaml');
  if (!fs.existsSync(modulesPath)) {
    return undefined;
  }
  const { packageManager } = YAML.parse(fs.readFileSync(modulesPath, 'utf8'));
  const match = PNPM_PATTERN.exec(packageManager ?? '');
  if (!match) {
    throw new Error(
      `The shell project at ${projectDirectory} was not installed with pnpm. Its node_modules/.modules.yaml records packageManager ${JSON.stringify(
        packageManager
      )}.`
    );
  }
  return match[1];
}

export default readShellPnpmVersion;
