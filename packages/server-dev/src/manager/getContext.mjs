/*
  Copyright 2020-2021 Lowdefy, Inc

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
/* eslint-disable no-console */

import path from 'path';
import { createRequire } from 'module';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import initialBuild from './processes/initialBuild.mjs';
import installPlugins from './processes/installPlugins.mjs';
import lowdefyBuild from './processes/lowdefyBuild.mjs';
import nextBuild from './processes/nextBuild.mjs';
import readDotEnv from './processes/readDotEnv.mjs';
import reloadClients from './processes/reloadClients.mjs';
import restartServer from './processes/restartServer.mjs';
import shutdownServer from './processes/shutdownServer.mjs';
import startWatchers from './processes/startWatchers.mjs';

const argv = yargs(hideBin(process.argv)).argv;
const require = createRequire(import.meta.url);

async function getContext() {
  const { verbose = false } = argv;
  const context = {
    bin: {
      // TODO: The string replace is a little hacky and will fail if the location of the bin changes,
      lowdefyBuild: require.resolve('@lowdefy/build').replace('index.js', 'scripts/run.js'),
      next: require.resolve('next').replace('server/next.js', 'bin/next'),
    },
    directories: {
      build: path.resolve(process.cwd(), './build'),
      config: path.resolve(
        argv.configDirectory || process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd()
      ),
      server: process.cwd(),
    },
    packageManager: argv.packageManager || process.env.LOWDEFY_PACKAGE_MANAGER || 'npm',
    port: argv.port || process.env.PORT || 3000,
    verbose,
    version: process.env.npm_package_version,
  };

  context.initialBuild = initialBuild(context);
  context.installPlugins = installPlugins(context);
  context.lowdefyBuild = lowdefyBuild(context);
  context.nextBuild = nextBuild(context);
  context.readDotEnv = readDotEnv(context);
  context.reloadClients = reloadClients(context);
  context.restartServer = restartServer(context);
  context.shutdownServer = shutdownServer(context);
  context.startWatchers = startWatchers(context);

  return context;
}

export default getContext;
