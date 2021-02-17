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
import checkForUpdatedVersions from './checkForUpdatedVersions';
import getConfig from './getConfig';
import getSendTelemetry from './getSendTelemetry';
import createPrint from './print';
import { cacheDirectoryPath, outputDirectoryPath } from './directories';
import packageJson from '../../package.json';
const { version: cliVersion } = packageJson;

async function startUp({ context, options = {}, command, lowdefyFileNotRequired }) {
  context.command = command;
  context.cliVersion = cliVersion;
  context.print = createPrint({
    basic: options.basicPrint,
  });

  context.baseDirectory = path.resolve(options.baseDirectory || process.cwd());
  context.cacheDirectory = path.resolve(context.baseDirectory, cacheDirectoryPath);

  if (options.outputDirectory) {
    context.outputDirectory = path.resolve(options.outputDirectory);
  } else {
    context.outputDirectory = path.resolve(context.baseDirectory, outputDirectoryPath);
  }
  if (!lowdefyFileNotRequired) {
    const { appId, disableTelemetry, lowdefyVersion } = await getConfig(context);
    context.appId = appId;
    context.disableTelemetry = disableTelemetry;
    context.lowdefyVersion = lowdefyVersion;
    context.print.log(`Running 'lowdefy ${command}'. Lowdefy app version ${lowdefyVersion}.`);
  } else {
    context.print.log(`Running 'lowdefy ${command}'.`);
  }
  await checkForUpdatedVersions(context);
  context.sendTelemetry = getSendTelemetry(context);
  return context;
}

export default startUp;
