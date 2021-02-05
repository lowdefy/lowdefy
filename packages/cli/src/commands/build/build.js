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
import fse from 'fs-extra';
import startUp from '../../utils/startUp';
import getFederatedModule from '../../utils/getFederatedModule';

async function build(options) {
  const context = await startUp(options);
  const { default: buildScript } = await getFederatedModule({
    module: 'build',
    packageName: '@lowdefy/build',
    version: context.lowdefyVersion,
    context,
  });
  context.print.log(
    `Cleaning block meta cache at "${path.resolve(context.cacheDirectory, './meta')}".`
  );
  await fse.emptyDir(path.resolve(context.cacheDirectory, './meta'));
  context.print.info('Starting build.');
  await buildScript({
    logger: context.print,
    cacheDirectory: context.cacheDirectory,
    configDirectory: context.baseDirectory,
    outputDirectory: context.outputDirectory,
  });
  await context.sendTelemetry({
    data: {
      command: 'build',
    },
  });
  context.print.log(`Build artifacts saved at ${context.outputDirectory}.`);
  context.print.succeed(`Build successful.`);
}

export default build;
