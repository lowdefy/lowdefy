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

import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import lowdefyBuild from './processes/lowdefyBuild.mjs';
import nextBuild from './processes/nextBuild.mjs';
import installServer from './processes/installServer.mjs';
import reloadClients from './processes/reloadClients.mjs';

const argv = yargs(hideBin(process.argv)).argv;

async function getContext() {
  const { configDirectory = process.cwd(), packageManager = 'npm', verbose = false } = argv;
  const context = {
    directories: {
      config: path.resolve(configDirectory),
    },
    packageManager,
    restartServer: () => {},
    shutdownServer: () => {},
    verbose,
  };
  context.installServer = installServer(context);
  context.lowdefyBuild = lowdefyBuild(context);
  context.nextBuild = nextBuild(context);
  context.reloadClients = reloadClients(context);

  return context;
}

export default getContext;
