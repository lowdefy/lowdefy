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

import readFile from './readFile.js';

// The files whose content decides what an install of the server in directory
// does. A missing file reads as null.
async function readInstallFiles({ directory }) {
  const packageJsonContent = await readFile(path.join(directory, 'package.json'));
  if (packageJsonContent === null) {
    throw new Error(`Could not read package.json in ${directory}.`);
  }
  // A server that installs as its own workspace takes its overrides, patches
  // and build allowlists from pnpm-workspace.yaml, and its registries from
  // .npmrc, so a change there also needs an install.
  const workspaceYamlContent = await readFile(path.join(directory, 'pnpm-workspace.yaml'));
  const npmrcContent = await readFile(path.join(directory, '.npmrc'));
  return { packageJsonContent, workspaceYamlContent, npmrcContent };
}

export default readInstallFiles;
