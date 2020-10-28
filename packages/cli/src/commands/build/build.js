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
import getLowdefyVersion from '../../utils/getLowdefyVersion';
import createPrint from '../../utils/print';
import { cacheDirectoryPath, outputDirectoryPath } from '../../utils/directories';

async function build(program) {
  let baseDirectory = process.cwd();
  if (program.baseDirectory) {
    baseDirectory = path.resolve(program.baseDirectory);
  }
  const version = await getLowdefyVersion(program.baseDirectory);
  const cacheDirectory = path.resolve(baseDirectory, cacheDirectoryPath);
  const buildScript = await getBuildScript(version, cacheDirectory);

  buildScript({
    logger: createPrint({ timestamp: true }),
    cacheDirectory,
    configDirectory: baseDirectory,
    outputDirectory: path.resolve(baseDirectory, outputDirectoryPath),
  });
}

export default build;
