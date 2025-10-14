#!/usr/bin/env node
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
import pino from 'pino';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import build from '@lowdefy/build';
import createCustomPluginTypesMap from './createCustomPluginTypesMap.mjs';

const argv = yargs(hideBin(process.argv)).argv;

async function run() {
  const serverDirectory = path.resolve(
    argv.serverDirectory || process.env.LOWDEFY_DIRECTORY_SERVER || process.cwd()
  );
  const directories = {
    build: path.join(serverDirectory, 'build'),
    config: path.resolve(
      argv.configDirectory || process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd()
    ),
    server: serverDirectory,
  };

  const customTypesMap = await createCustomPluginTypesMap({ directories });

  const logger = pino({
    name: 'lowdefy_build',
    level: process.env.LOWDEFY_LOG_LEVEL ?? 'info',
    base: { pid: undefined, hostname: undefined },
    mixin: (context, level) => {
      return {
        ...context,
        print: context.print ?? logger.levels.labels[level],
      };
    },
  });

  await build({
    customTypesMap,
    directories,
    logger,
    refResolver: argv.refResolver || process.env.LOWDEFY_BUILD_REF_RESOLVER,
  });
}

run();
