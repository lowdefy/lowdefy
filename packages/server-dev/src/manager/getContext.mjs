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
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readFile } from '@lowdefy/node-utils';

import lowdefyBuild from './processes/lowdefyBuild.mjs';
import nextBuild from './processes/nextBuild.mjs';
import installPlugins from './processes/installPlugins.mjs';
import startServerProcess from './processes/startServerProcess.mjs';
import reloadClients from './processes/reloadClients.mjs';

const argv = yargs(hideBin(process.argv)).argv;

async function getContext() {
  const { packageManager = 'npm', verbose = false } = argv;
  const context = {
    directories: {
      build: path.resolve(process.cwd(), './build'),
      config: path.resolve(
        argv.configDirectory || process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd()
      ),
      server: process.cwd(),
    },
    packageManager,
    restartServer: () => {
      if (context.serverProcess) {
        console.log('Restarting server...');
        context.serverProcess.kill();
        startServerProcess(context);
      }
    },
    shutdownServer: () => {
      if (context.serverProcess) {
        console.log('Shutting down server...');
        context.serverProcess.kill();
      }
    },
    verbose,
  };

  const packageJson = JSON.parse(
    await readFile(path.join(context.directories.server, 'package.json'))
  );
  context.version = packageJson.version;
  context.installPlugins = installPlugins(context);
  context.lowdefyBuild = lowdefyBuild(context);
  context.nextBuild = nextBuild(context);
  context.reloadClients = reloadClients(context);

  return context;
}

export default getContext;
