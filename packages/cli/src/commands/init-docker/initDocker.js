/*
  Copyright 2020-2024 Lowdefy, Inc

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

async function initDocker({ context }) {
  context.print.log('Initializing Docker deployment.');
  const dockerfile = await readFile(url.fileURLToPath(new URL('./Dockerfile', import.meta.url)));
  await writeFile(path.join(context.directories.config, 'Dockerfile'), dockerfile);
  context.print.log("Created 'Dockerfile'.");
  const dockerignore = await readFile(
    url.fileURLToPath(new URL('./.dockerignore', import.meta.url))
  );
  await writeFile(path.join(context.directories.config, '.dockerignore'), dockerignore);
  context.print.log("Created '.dockerignore'.");

  await context.sendTelemetry();
  context.print.succeed('Docker deployment initialized.');
}

export default initDocker;
