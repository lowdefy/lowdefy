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

import { ConfigError } from '@lowdefy/errors';

import fetchGitHubModule from './fetchGitHubModule.js';
import parseModuleSource from './parseModuleSource.js';

async function fetchModules({ moduleEntries, context }) {
  const resolved = {};

  for (const entry of moduleEntries) {
    const source = parseModuleSource(entry.source);

    if (source.type === 'file') {
      const resolvedPath = path.resolve(context.directories.config, source.path);
      if (!fs.existsSync(path.join(resolvedPath, 'module.yaml'))) {
        throw new ConfigError(
          `Module "${entry.id}": module.yaml not found at ${resolvedPath}`
        );
      }
      resolved[entry.id] = {
        packageRoot: resolvedPath,
        moduleRoot: resolvedPath,
        isLocal: true,
      };
    } else if (source.type === 'github') {
      const cached = await fetchGitHubModule(source, context);
      const moduleRoot = source.path
        ? path.join(cached.packageRoot, source.path)
        : cached.packageRoot;

      if (!fs.existsSync(path.join(moduleRoot, 'module.yaml'))) {
        throw new ConfigError(
          `Module "${entry.id}": module.yaml not found at path "${source.path || '/'}" in ${source.owner}/${source.repo}@${source.ref}`
        );
      }

      resolved[entry.id] = {
        packageRoot: cached.packageRoot,
        moduleRoot,
        isLocal: false,
      };
    }
  }

  return resolved;
}

export default fetchModules;
