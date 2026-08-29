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

// A module that cannot be found is the expected miss this function degrades
// on. That includes a package that exists but does not export the requested
// subpath (ERR_PACKAGE_PATH_NOT_EXPORTED): every subpath here is optional, and
// a plugin that ships no `./schemas` is the normal case, not a broken plugin.
// Any other failure means the module exists but does not load (a syntax error,
// a throwing top-level import), which must surface here instead of resurfacing
// later as "type X is not defined".
const NOT_FOUND_CODES = new Set([
  'ERR_MODULE_NOT_FOUND',
  'MODULE_NOT_FOUND',
  'ERR_PACKAGE_PATH_NOT_EXPORTED',
]);

function isModuleNotFound(error) {
  return NOT_FOUND_CODES.has(error?.code);
}

// Import a plugin module (e.g. `${pkg}/schemas`, `${pkg}/connections`) for
// schema collection. Default packages resolve from the build package itself;
// custom plugins only exist in the server's node_modules, so fall back to
// resolving from the server directory. Returns undefined when unresolvable —
// callers degrade gracefully.
async function importPluginModule({ context, specifier }) {
  try {
    return await import(/* webpackIgnore: true */ /* @vite-ignore */ specifier);
  } catch (error) {
    // Not resolvable from the build package — try the server's node_modules.
    if (!isModuleNotFound(error)) throw error;
  }
  const serverDir = context.directories?.server;
  if (!serverDir) {
    return undefined;
  }
  try {
    const require = createRequire(path.join(serverDir, 'package.json'));
    return await import(/* webpackIgnore: true */ /* @vite-ignore */ require.resolve(specifier));
  } catch (error) {
    if (!isModuleNotFound(error)) throw error;
    return undefined;
  }
}

export default importPluginModule;
