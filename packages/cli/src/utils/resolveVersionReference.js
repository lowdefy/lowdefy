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
import { type } from '@lowdefy/helpers';

import findWorkspacePackages from './findWorkspacePackages.js';

function findCatalog({ catalogName, settings }) {
  if (catalogName === 'default') {
    return settings.catalog ?? settings.catalogs?.default;
  }
  return settings.catalogs?.[catalogName];
}

// A "$name" override takes the version of name in the root package.json,
// which for the server is its own package.json, so it is resolved here
// against the parent's. The server's workspace has none of the parent's
// packages and no catalogs of its own in the root package.json, so a
// "workspace:" version becomes a link: to the package, relative to the
// workspace root as the other specs are, and a "catalog:" version becomes the
// catalog entry.
function resolveVersionReference({ packages, rootDependencies, settings, spec, workspaceRoot }) {
  if (!type.isString(spec) || !spec.startsWith('$')) {
    return spec;
  }
  const name = spec.slice(1);
  const packageJsonPath = path.join(workspaceRoot, 'package.json');
  const version = rootDependencies[name];
  if (type.isNone(version)) {
    throw new Error(
      `Cannot resolve the override version "${spec}": ${packageJsonPath} has no dependency "${name}".`
    );
  }
  if (version.startsWith('workspace:')) {
    const packageDirectory = findWorkspacePackages({ packages, workspaceRoot }).get(name);
    if (type.isUndefined(packageDirectory)) {
      throw new Error(
        `Cannot resolve the override version "${spec}": ${packageJsonPath} has "${name}": "${version}", but no package named "${name}" was found in the pnpm workspace at ${workspaceRoot}.`
      );
    }
    return `link:${path.relative(workspaceRoot, packageDirectory).split(path.sep).join('/')}`;
  }
  if (version.startsWith('catalog:')) {
    const catalogName = version.slice('catalog:'.length) || 'default';
    const catalogVersion = findCatalog({ catalogName, settings })?.[name];
    if (type.isNone(catalogVersion)) {
      throw new Error(
        `Cannot resolve the override version "${spec}": ${packageJsonPath} has "${name}": "${version}", but the "${catalogName}" catalog in ${path.join(
          workspaceRoot,
          'pnpm-workspace.yaml'
        )} has no entry for "${name}".`
      );
    }
    return catalogVersion;
  }
  return version;
}

export default resolveVersionReference;
