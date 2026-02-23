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

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import pino from 'pino';
import { createNodeLogger } from '@lowdefy/logger/node';
import checkMockUserWarning from './processes/checkMockUserWarning.mjs';
import initialBuild from './processes/initialBuild.mjs';
import installPlugins from './processes/installPlugins.mjs';
import lowdefyBuild from './processes/lowdefyBuild.mjs';
import nextBuild from './processes/nextBuild.mjs';
import readDotEnv from './processes/readDotEnv.mjs';
import reloadClients from './processes/reloadClients.mjs';
import restartServer from './processes/restartServer.mjs';
import shutdownServer from './processes/shutdownServer.mjs';
import startWatchers from './processes/startWatchers.mjs';

import getNextBin from './utils/getNextBin.mjs';
import PageCache from '../lib/server/pageCache.mjs';

const argv = yargs(hideBin(process.argv)).array('watch').array('watchIgnore').argv;

async function getContext() {
  const env = process.env;

  const context = {
    bin: {
      next: getNextBin(),
    },
    directories: {
      build: path.resolve(process.cwd(), './build'),
      config: path.resolve(argv.configDirectory ?? env.LOWDEFY_DIRECTORY_CONFIG ?? process.cwd()),
      server: process.cwd(),
    },
    logger: createNodeLogger({
      name: 'lowdefy build',
      level: env.LOWDEFY_LOG_LEVEL ?? 'info',
      base: { pid: undefined, hostname: undefined },
      destination: pino.destination({ dest: 1, sync: true }),
    }),
    options: {
      port: argv.port ?? env.PORT ?? 3000,
      refResolver: argv.refResolver ?? env.LOWDEFY_BUILD_REF_RESOLVER,
      watch:
        argv.watch ?? env.LOWDEFY_SERVER_DEV_WATCH ? JSON.parse(env.LOWDEFY_SERVER_DEV_WATCH) : [],
      watchIgnore:
        argv.watchIgnore ?? env.LOWDEFY_SERVER_DEV_WATCH_IGNORE
          ? JSON.parse(env.LOWDEFY_SERVER_DEV_WATCH_IGNORE)
          : [],
    },
    version: env.npm_package_version,

    // JIT build state
    pageCache: new PageCache(),
    pageRegistry: null,
    buildContext: null,
  };

  context.packageManagerCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  context.checkMockUserWarning = checkMockUserWarning(context);
  context.initialBuild = initialBuild(context);
  context.installPlugins = installPlugins(context);

  // Wrap lowdefyBuild to capture and store the shallow build result
  const buildFn = lowdefyBuild(context);
  context.lowdefyBuild = async () => {
    const result = await buildFn();
    if (result) {
      context.pageRegistry = result.pageRegistry;
      context.buildContext = result.context;
    }
  };

  context.nextBuild = nextBuild(context);
  context.readDotEnv = readDotEnv(context);
  context.reloadClients = reloadClients(context);
  context.restartServer = restartServer(context);
  context.shutdownServer = shutdownServer(context);
  context.startWatchers = startWatchers(context);

  return context;
}

export default getContext;
