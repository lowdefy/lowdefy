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

import { createRequire } from 'node:module';
import path from 'node:path';

// Every subpath this function imports (`./schemas`, `./connections`, ...) is
// optional, so any failure to RESOLVE the specifier is the expected miss it
// degrades on: a package that is not installed, one whose "exports" map has no
// such subpath, a legacy package where the subpath lands on a directory, a bad
// exports target. Node reports each under its own code, all raised before any
// module code runs. A failure while LOADING a resolved module (a syntax error,
// a throwing top-level import) is a real fault and must surface here instead
// of resurfacing later as "type X is not defined".
const RESOLUTION_ERROR_CODES = new Set([
  'ERR_MODULE_NOT_FOUND',
  'MODULE_NOT_FOUND',
  'ERR_PACKAGE_PATH_NOT_EXPORTED',
  'ERR_PACKAGE_IMPORT_NOT_DEFINED',
  'ERR_UNSUPPORTED_DIR_IMPORT',
  'ERR_INVALID_PACKAGE_TARGET',
  'ERR_INVALID_PACKAGE_CONFIG',
  'ERR_INVALID_MODULE_SPECIFIER',
]);

function isResolutionError(error) {
  return RESOLUTION_ERROR_CODES.has(error?.code);
}

// Import a plugin module (e.g. `${pkg}/schemas`, `${pkg}/connections`) for
// schema collection. The server's node_modules is tried FIRST: it pins the
// exact plugin versions the app installed, while resolving from the build
// package can land on a different (stale) copy of a default plugin through a
// package manager's hoist directory when several versions coexist in the
// store. The bare import stays as the fallback for contexts with no server
// directory. Returns undefined when unresolvable — callers degrade gracefully.
async function importPluginModule({ context, specifier }) {
  const serverDir = context.directories?.server;
  if (serverDir) {
    try {
      const require = createRequire(path.join(serverDir, 'package.json'));
      return await import(/* webpackIgnore: true */ /* @vite-ignore */ require.resolve(specifier));
    } catch (error) {
      // Not resolvable from the server — try the build package's own tree.
      if (!isResolutionError(error)) throw error;
    }
  }
  try {
    return await import(/* webpackIgnore: true */ /* @vite-ignore */ specifier);
  } catch (error) {
    if (!isResolutionError(error)) throw error;
    return undefined;
  }
}

export default importPluginModule;
