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

import addCustomPluginsAsDeps from './addCustomPluginsAsDeps.js';
import ensurePnpmWorkspaceYaml from './ensurePnpmWorkspaceYaml.js';
import getServer from './getServer.js';
import installServer from './installServer.js';

// Fetches @lowdefy/server-dev into the dev directory and installs its
// dependencies and the app's plugins. Starts no server.
async function installDevServer({ context }) {
  const directory = context.directories.dev;
  await getServer({ context, packageName: '@lowdefy/server-dev', directory });
  // Dev keeps the plugin dependency set accumulated by previous sessions —
  // resetting package.json to package.original.json here would uninstall
  // JIT-added plugin packages, churn the lockfile (invalidating Vite's
  // optimizer cache), and force reinstalls on first navigation. The full
  // `lowdefy build` recomputes the complete set, and getServer replaces
  // package.json when the lowdefy version changes.
  await addCustomPluginsAsDeps({ context, directory });
  await ensurePnpmWorkspaceYaml({ context, directory });
  await installServer({ context, directory });
}

export default installDevServer;
