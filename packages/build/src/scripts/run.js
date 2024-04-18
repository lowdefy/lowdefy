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
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import build from '../index.js';

const argv = yargs(hideBin(process.argv)).argv;

async function run() {
  await build({
    directories: {
      build: path.resolve(
        argv.buildDirectory ??
          process.env.LOWDEFY_DIRECTORY_BUILD ??
          path.join(process.cwd(), 'build')
      ),
      config: path.resolve(
        argv.configDirectory ?? process.env.LOWDEFY_DIRECTORY_CONFIG ?? process.cwd()
      ),
      server: path.resolve(
        argv.serverDirectory ?? process.env.LOWDEFY_DIRECTORY_SERVER ?? process.cwd()
      ),
    },
    logger: console,
    refResolver: argv.refResolver ?? process.env.LOWDEFY_BUILD_REF_RESOLVER,
    stage: argv.stage ?? process.env.LOWDEFY_BUILD_STAGE ?? 'prod',
  });
}

run();
