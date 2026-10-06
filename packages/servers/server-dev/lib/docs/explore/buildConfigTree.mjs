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
import { parseArgs } from 'node:util';
import pino from 'pino';
import { createNodeLogger } from '@lowdefy/logger/node';

import runConfigTreeBuild from './runConfigTreeBuild.mjs';

// Entry for the explorer's base and head builds and the journey readers'
// config text set: the CLI spawns
// `node <dev>/lib/docs/explore/buildConfigTree.mjs --config <dir> --out <dir>`
// from the installed dev server, which holds @lowdefy/build and the app's
// plugins. Exits 1 when the build fails; <out>/result.json says why.
async function buildConfigTree() {
  const { values } = parseArgs({
    options: { config: { type: 'string' }, out: { type: 'string' } },
  });
  const logger = createNodeLogger({
    name: 'lowdefy explore build',
    level: process.env.LOWDEFY_LOG_LEVEL ?? 'info',
    base: { pid: undefined, hostname: undefined },
    destination: pino.destination({ dest: 1, sync: true }),
  });
  if (!values.config || !values.out) {
    logger.error('buildConfigTree needs --config <dir> and --out <dir>.');
    process.exitCode = 1;
    return;
  }
  const result = await runConfigTreeBuild({
    configDirectory: path.resolve(values.config),
    outDirectory: path.resolve(values.out),
    devDirectory: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'),
    logger,
    refResolver: process.env.LOWDEFY_BUILD_REF_RESOLVER,
  });
  if (result.status !== 'ok') {
    process.exitCode = 1;
  }
}

await buildConfigTree();
