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

// The Vercel function entry is no longer scaffolded here: the deployment uses the Vercel Build
// Output API, and `lowdefy vercel-output` (run by vercel.build.sh) generates the function and
// deployment config into .vercel/output at build time.
async function initVercel({ context }) {
  context.logger.info('Initializing Vercel deployment.');

  const deployDir = path.join(context.directories.config, 'deploy');

  const installScript = await readFile(
    url.fileURLToPath(new URL('./vercel.install.sh', import.meta.url))
  );
  await writeFile(path.join(deployDir, 'vercel.install.sh'), installScript);
  context.logger.info("Created 'vercel.install.sh'.");

  const buildScript = await readFile(
    url.fileURLToPath(new URL('./vercel.build.sh', import.meta.url))
  );
  await writeFile(path.join(deployDir, 'vercel.build.sh'), buildScript);
  context.logger.info("Created 'vercel.build.sh'.");

  const vercelJson = await readFile(url.fileURLToPath(new URL('./vercel.json', import.meta.url)));
  await writeFile(path.join(deployDir, 'vercel.json'), vercelJson);
  context.logger.info("Created 'vercel.json'.");

  const readMe = await readFile(url.fileURLToPath(new URL('./README.md', import.meta.url)));
  await writeFile(path.join(deployDir, 'README.md'), readMe);
  context.logger.info("Created 'README.md'.");

  await context.sendTelemetry();
  context.logger.info({ spin: 'succeed' }, 'Vercel deployment initialized.');
}

export default initVercel;
