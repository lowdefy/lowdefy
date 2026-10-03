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

import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

import rebaseWorkspaceSettings from './rebaseWorkspaceSettings.js';

// The server's own dependencies with build scripts, as in the standalone
// pnpm-workspace.yaml ensurePnpmWorkspaceYaml writes.
const defaultBuiltDependencies = ['better-sqlite3', 'sharp'];

// The server installs as its own workspace, with a lockfile inside the
// gitignored server directory, so installing it never rewrites the parent's
// committed lockfile. Every parent setting is carried over, rebased to the
// server directory, so the server installs as it would inside the parent.
function createNestedWorkspaceYaml({ directory, parentWorkspace, workspaceRoot }) {
  const settings = rebaseWorkspaceSettings({
    directory,
    packages: parentWorkspace.packages,
    rootDependencies: parentWorkspace.rootDependencies,
    settings: parentWorkspace.settings,
    workspaceRoot,
  });
  const workspace = {
    packages: ['.'],
    ...settings,
    onlyBuiltDependencies: [
      ...new Set([...defaultBuiltDependencies, ...(settings.onlyBuiltDependencies ?? [])]),
    ],
    allowBuilds: {
      ...Object.fromEntries(defaultBuiltDependencies.map((name) => [name, true])),
      ...settings.allowBuilds,
    },
  };
  if (!type.isNone(settings.patchedDependencies)) {
    // The parent's patches are copied whole, and some patch packages only the
    // parent's own projects install.
    workspace.allowUnusedPatches = true;
  }
  return YAML.stringify(workspace);
}

export default createNestedWorkspaceYaml;
