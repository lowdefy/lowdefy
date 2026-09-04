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

import { isReserved, type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';
import { moduleLockfileName, readModuleLockfile, writeModuleLockfile } from '@lowdefy/node-utils';

import fetchGitHubModule from './fetchGitHubModule.js';
import getGitHubHeaders from './getGitHubHeaders.js';
import isImmutableRef from './isImmutableRef.js';
import parseModuleSource from './parseModuleSource.js';
import resolveGitHubCommit from './resolveGitHubCommit.js';

// A lock entry only pins anything if its commit is a full git object id; a
// hand-edited "commit: main" would be passed to the fetch as a ref and
// re-enable the drift the lockfile exists to prevent.
const COMMIT_SHA = /^[0-9a-f]{40}$/;

function findGitRoot(startPath) {
  let dir = startPath;
  while (true) {
    if (fs.existsSync(path.join(dir, '.git'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

async function fetchModules({ moduleEntries, context }) {
  const resolved = {};
  const lockfile = await readModuleLockfile({ configDirectory: context.directories.config });
  // Only github entries are locked, so entries dropped from lowdefy.yaml or
  // changed to a file: source fall out of the rewritten lockfile.
  const nextLockfile = {};
  let headers;

  for (const entry of moduleEntries) {
    // Module ids come from the app's lowdefy.yaml and key both the resolved map
    // and the lockfile, so reject reserved names before anything is written.
    if (isReserved(entry.id)) {
      throw new ConfigError(`Module entry id "${entry.id}" is a reserved name.`);
    }
    const source = parseModuleSource(entry.source);

    if (source.type === 'file') {
      const resolvedPath = path.resolve(context.directories.config, source.path);
      if (!fs.existsSync(path.join(resolvedPath, 'module.lowdefy.yaml'))) {
        throw new ConfigError(
          `Module "${entry.id}": module.lowdefy.yaml not found at ${resolvedPath}`
        );
      }
      resolved[entry.id] = {
        packageRoot: findGitRoot(resolvedPath) ?? resolvedPath,
        moduleRoot: resolvedPath,
        isLocal: true,
      };
    } else if (source.type === 'github') {
      const locked = lockfile[entry.id];
      // The lock is keyed on the full source string so a changed owner, repo or
      // path invalidates the entry instead of pinning a foreign commit.
      const isLockValid =
        type.isObject(locked) &&
        locked.source === entry.source &&
        type.isString(locked.commit) &&
        COMMIT_SHA.test(locked.commit);

      if (type.isObject(locked) && locked.source === entry.source && !isLockValid) {
        throw new ConfigError(
          `Module "${entry.id}" has a lock entry in ${moduleLockfileName} whose commit is not a 40 character sha. ` +
            `Received ${JSON.stringify(
              locked.commit
            )}. Run "lowdefy modules update" to re-resolve it.`
        );
      }

      let commit;
      if (isLockValid) {
        commit = locked.commit;
        nextLockfile[entry.id] = locked;
      } else {
        // A build that may rewrite the lockfile fixes the drift itself; a
        // production build cannot, so it fails here rather than after
        // resolving and fetching a module it is not allowed to pin.
        if (!context.writeModuleLock && !isImmutableRef(source.ref)) {
          throw new ConfigError(
            `Module "${entry.id}" resolves branch ref "${source.ref}" with no entry in ${moduleLockfileName}. ` +
              `A production build cannot pin it. Run "lowdefy modules update" and commit the lockfile ` +
              `so production builds are reproducible.`
          );
        }
        if (type.isNone(headers)) {
          headers = await getGitHubHeaders();
        }
        commit = await resolveGitHubCommit({
          owner: source.owner,
          repo: source.repo,
          ref: source.ref,
          headers,
        });
        nextLockfile[entry.id] = {
          source: entry.source,
          ref: source.ref,
          commit,
        };
      }

      // A 40 character sha is an immutable ref, so the cache at
      // .lowdefy/modules/github/{owner}/{repo}/{commit}/ is never refetched.
      const cached = await fetchGitHubModule({ ...source, ref: commit }, context);
      const moduleRoot = source.path
        ? path.join(cached.packageRoot, source.path)
        : cached.packageRoot;

      if (!fs.existsSync(path.join(moduleRoot, 'module.lowdefy.yaml'))) {
        throw new ConfigError(
          `Module "${entry.id}": module.lowdefy.yaml not found at path "${source.path || '/'}" in ${
            source.owner
          }/${source.repo}@${source.ref}`
        );
      }

      resolved[entry.id] = {
        packageRoot: cached.packageRoot,
        moduleRoot,
        isLocal: false,
      };
    }
  }

  // Nothing to lock and nothing locked before means no lockfile is created for
  // apps that use no github modules. writeFileIfChanged handles the rest.
  const hasLockContent = Object.keys(nextLockfile).length > 0 || Object.keys(lockfile).length > 0;

  if (context.writeModuleLock && hasLockContent) {
    await writeModuleLockfile({
      configDirectory: context.directories.config,
      lockfile: nextLockfile,
    });
  }

  return resolved;
}

export default fetchModules;
