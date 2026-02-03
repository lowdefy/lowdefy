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
import { type } from '@lowdefy/helpers';

import checkPnpmIsInstalled from './checkPnpmIsInstalled.js';
import { createCliLogger } from '@lowdefy/logger/cli';
import getCliJson from './getCliJson.js';
import getDirectories from './getDirectories.js';
import getLowdefyYaml from './getLowdefyYaml.js';
import getOptions from './getOptions.js';
import getSendTelemetry from './getSendTelemetry.js';
import readDotEnv from './readDotEnv.js';
import validateVersion from './validateVersion.js';

async function startUp({ context, options = {}, command }) {
  context.command = command.name();
  context.commandLineOptions = options;
  context.configDirectory = path.resolve(options.configDirectory || process.cwd());
  readDotEnv(context);
  context.requiresLowdefyYaml = !['init'].includes(command.name());
  const { cliConfig, lowdefyVersion, plugins } = await getLowdefyYaml(context);
  context.cliConfig = cliConfig;
  context.lowdefyVersion = lowdefyVersion;
  context.plugins = plugins;

  const { appId } = await getCliJson(context);
  context.appId = appId;

  context.options = getOptions(context);
  context.logger = createCliLogger({ logLevel: context.options.logLevel });

  context.directories = getDirectories(context);

  context.pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  checkPnpmIsInstalled({ logger: context.logger, pnpmCmd: context.pnpmCmd });
  await validateVersion(context);
  context.sendTelemetry = getSendTelemetry(context);

  if (type.isNone(lowdefyVersion)) {
    context.logger.ui.log(`Running 'lowdefy ${context.command}'.`);
  } else {
    context.logger.ui.log(
      `Running 'lowdefy ${context.command}'. Lowdefy app version ${lowdefyVersion}.`
    );
  }
  return context;
}

export default startUp;
