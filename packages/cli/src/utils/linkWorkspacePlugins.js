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
import { linkWorkspaceDependencies, readFile, writeFileIfChanged } from '@lowdefy/node-utils';

// The server installs as its own workspace, so its "workspace:" plugins
// become link: paths to their packages in the parent workspace; the dev
// server's builds link plugins added later the same way. The parent's pinned
// pnpm is carried over too, since pnpm and corepack read it from the root of
// the workspace they install.
async function linkWorkspacePlugins({ directory, parentWorkspace }) {
  const packageJsonPath = path.join(directory, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath));

  packageJson.dependencies = await linkWorkspaceDependencies({
    dependencies: packageJson.dependencies,
    directory,
  });

  if (parentWorkspace.packageManager?.startsWith('pnpm@')) {
    packageJson.packageManager = parentWorkspace.packageManager;
  }

  await writeFileIfChanged(packageJsonPath, JSON.stringify(packageJson, null, 2).concat('\n'));
}

export default linkWorkspacePlugins;
