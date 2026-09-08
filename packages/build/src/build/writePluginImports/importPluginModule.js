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

// Import a plugin module (e.g. `${pkg}/schemas`, `${pkg}/connections`) for
// schema collection. Default packages resolve from the build package itself;
// custom plugins only exist in the server's node_modules, so fall back to
// resolving from the server directory. Returns undefined when unresolvable —
// callers degrade gracefully.
async function importPluginModule({ context, specifier }) {
  try {
    return await import(/* webpackIgnore: true */ /* @vite-ignore */ specifier);
  } catch {
    // Not resolvable from the build package — try the server's node_modules.
  }
  const serverDir = context.directories?.server;
  if (!serverDir) {
    return undefined;
  }
  try {
    const require = createRequire(path.join(serverDir, 'package.json'));
    return await import(/* webpackIgnore: true */ /* @vite-ignore */ require.resolve(specifier));
  } catch {
    return undefined;
  }
}

export default importPluginModule;
