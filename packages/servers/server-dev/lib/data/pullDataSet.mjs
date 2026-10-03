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

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pino from 'pino';
import { createNodeLogger } from '@lowdefy/logger/node';

import runDataSetPull from './runDataSetPull.mjs';

// Entry for `lowdefy data pull <name>`: the CLI spawns `node <dev>/lib/data/pullDataSet.mjs <name>`
// with the shell's environment and LOWDEFY_DIRECTORY_CONFIG, and exits with this process's code.
async function pullDataSet() {
  const logger = createNodeLogger({
    name: 'lowdefy data pull',
    level: process.env.LOWDEFY_LOG_LEVEL ?? 'info',
    base: { pid: undefined, hostname: undefined },
    destination: pino.destination({ dest: 1, sync: true }),
  });
  try {
    await runDataSetPull({
      configDirectory: path.resolve(process.env.LOWDEFY_DIRECTORY_CONFIG ?? process.cwd()),
      name: process.argv[2],
      serverDirectory: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'),
      logger,
      env: process.env,
    });
  } catch (error) {
    logger.error(error.message);
    process.exitCode = 1;
  }
}

await pullDataSet();
