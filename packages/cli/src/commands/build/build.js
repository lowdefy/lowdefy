/*
  Copyright 2020 Lowdefy, Inc

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
import getBuildScript from './getBuildScript';
import createContext from '../../utils/context';
import { outputDirectoryPath } from '../../utils/directories';

async function build(options) {
  const context = await createContext(options);
  await getBuildScript(context);
  const outputDirectory = path.resolve(context.baseDirectory, outputDirectoryPath);
  context.print.info('Starting build.');
  await context.buildScript({
    logger: context.print,
    cacheDirectory: context.cacheDirectory,
    configDirectory: context.baseDirectory,
    outputDirectory,
  });
  context.print.info(`Build artifacts saved at ${outputDirectory}.`);
}

export default build;
