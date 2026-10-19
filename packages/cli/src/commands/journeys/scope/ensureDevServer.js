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

import fs from 'fs';
import path from 'path';

import installDevServer from '../../../utils/installDevServer.js';

// Scope builds with the installed dev server's builder, so a checkout with
// no finished install gets one the way lowdefy dev installs it, without
// starting a server. The install hash is written only once pnpm install
// succeeds, so a fetch or install that stopped part way is retried. A
// finished install is left alone, since a dev server may be running from it,
// and so is a local server, which the developer prepares.
async function ensureDevServer({ context }) {
  if (context.lowdefyVersion === 'local') return;
  const installHash = path.join(context.directories.dev, 'node_modules', '.lowdefy-install-hash');
  if (fs.existsSync(installHash)) return;
  context.logger.info('Installing the dev server to build the config.');
  await installDevServer({ context });
}

export default ensureDevServer;
