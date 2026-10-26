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

import path from 'node:path';
import { type } from '@lowdefy/helpers';
import { findPnpmWorkspaceRoot, readFile, writeFileIfChanged } from '@lowdefy/node-utils';

import createNestedNpmrc from '../../utils/createNestedNpmrc.js';

// The project is its own pnpm workspace, so installing it never joins the
// app's workspace or rewrites its lockfile. It takes none of the app's
// workspace settings (overrides, patches, build allowlists): those are about
// the app's dependencies, and the folder is uploaded to EAS, where paths into
// the app's repository do not exist.
const PNPM_WORKSPACE_YAML = `packages:
  - '.'
`;

// Registries and their auth (as environment references) still apply, so the
// parent's .npmrc is carried over as the server's is; credentials written out
// in it are left behind.
async function writeShellNpmrc({ context, directory, workspaceRoot }) {
  const parentNpmrcPath = path.join(workspaceRoot, '.npmrc');
  const parentNpmrc = await readFile(parentNpmrcPath);
  if (type.isNone(parentNpmrc)) {
    return;
  }
  const { content, skippedKeys } = createNestedNpmrc({
    directory,
    parentNpmrc,
    parentNpmrcPath,
    serverNpmrc: null,
    workspaceRoot,
  });
  skippedKeys.forEach((key) => {
    context.logger.warn(
      `"${key}" in ${parentNpmrcPath} holds a credential, so it is not copied to the shell project's .npmrc. Reference an environment variable instead (${key}=\${NPM_TOKEN}).`
    );
  });
  await writeFileIfChanged(path.join(directory, '.npmrc'), content);
}

async function writeShellWorkspace({ context, directory }) {
  await writeFileIfChanged(path.join(directory, 'pnpm-workspace.yaml'), PNPM_WORKSPACE_YAML);
  const workspaceRoot = findPnpmWorkspaceRoot(path.dirname(directory));
  if (workspaceRoot === null) {
    return;
  }
  await writeShellNpmrc({ context, directory, workspaceRoot });
}

export default writeShellWorkspace;
