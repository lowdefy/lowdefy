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

import path from 'path';
import YAML from 'yaml';
import { type } from '@lowdefy/helpers';
import { readFile } from '@lowdefy/node-utils';

// The install settings of the parent workspace that must keep applying to the
// generated server once it installs as its own workspace.
const settingKeys = [
  'allowBuilds',
  'catalog',
  'catalogs',
  'ignoredBuiltDependencies',
  'onlyBuiltDependencies',
  'overrides',
  'packageExtensions',
  'patchedDependencies',
  'peerDependencyRules',
];

async function readParentWorkspace({ workspaceRoot }) {
  const workspaceYaml =
    YAML.parse(await readFile(path.join(workspaceRoot, 'pnpm-workspace.yaml'))) ?? {};
  const packageJsonContent = await readFile(path.join(workspaceRoot, 'package.json'));
  const packageJson = type.isNone(packageJsonContent) ? {} : JSON.parse(packageJsonContent);

  // pnpm 9 and 10 also read these settings from the "pnpm" field of the root
  // package.json; pnpm-workspace.yaml wins where both set one.
  const settings = {};
  settingKeys.forEach((key) => {
    const value = workspaceYaml[key] ?? packageJson.pnpm?.[key];
    if (!type.isNone(value)) {
      settings[key] = value;
    }
  });

  return {
    packageManager: packageJson.packageManager,
    packages: workspaceYaml.packages ?? [],
    settings,
  };
}

export default readParentWorkspace;
