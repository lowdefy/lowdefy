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
import getFederatedModule from '../../utils/getFederatedModule';

async function build({ context }) {
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
    blocksServerUrl: context.options.blocksServerUrl,
    buildDirectory: context.buildDirectory,
    cacheDirectory: context.cacheDirectory,
    configDirectory: context.baseDirectory,
    logger: context.print,
    refResolver: context.options.refResolver,
  });
  await context.sendTelemetry();
  context.print.log(`Build artifacts saved at ${context.buildDirectory}.`);
  context.print.succeed(`Build successful.`);
}

export default build;
