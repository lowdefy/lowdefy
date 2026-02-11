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
import url from 'url';
import { readFile, writeFile } from '@lowdefy/node-utils';

async function initVercel({ context }) {
  context.logger.info('Initializing Vercel deployment.');

  const installScript = await readFile(
    url.fileURLToPath(new URL('./vercel.install.sh', import.meta.url))
  );
  await writeFile(
    path.join(context.directories.config, 'deploy', 'vercel.install.sh'),
    installScript
  );
  context.logger.info("Created 'vercel.install.sh'.");
  const readMe = await readFile(url.fileURLToPath(new URL('./README.md', import.meta.url)));
  await writeFile(path.join(context.directories.config, 'deploy', 'README.md'), readMe);
  context.logger.info("Created 'README.md'.");

  await context.sendTelemetry();
  context.logger.info('Vercel deployment initialized.', { succeed: true });
}

export default initVercel;
