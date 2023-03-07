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
import { type } from '@lowdefy/helpers';

import validateVersion from './validateVersion';
import getCliJson from './getCliJson';
import getDirectories from './getDirectories';
import getLowdefyYaml from './getLowdefyYaml';
import getOptions from './getOptions';
import getSendTelemetry from './getSendTelemetry';
import createPrint from './print';
import packageJson from '../../package.json';
const { version: cliVersion } = packageJson;

async function startUp({ context, options = {}, command }) {
  context.command = command.name();
  context.cliVersion = cliVersion;
  context.commandLineOptions = options;
  context.print = createPrint();
  context.baseDirectory = path.resolve(options.baseDirectory || process.cwd());

  const { cliConfig, lowdefyVersion } = await getLowdefyYaml(context);
  context.cliConfig = cliConfig;
  context.lowdefyVersion = lowdefyVersion;

  const { appId } = await getCliJson(context);
  context.appId = appId;

  context.options = getOptions(context);

  const { cacheDirectory, outputDirectory } = getDirectories(context);
  context.cacheDirectory = cacheDirectory;
  context.outputDirectory = outputDirectory;

  await validateVersion(context);

  context.sendTelemetry = getSendTelemetry(context);

  if (type.isNone(lowdefyVersion)) {
    context.print.log(`Running 'lowdefy ${context.command}'.`);
  } else {
    context.print.log(
      `Running 'lowdefy ${context.command}'. Lowdefy app version ${lowdefyVersion}.`
    );
  }
  return context;
}

export default startUp;
