/* eslint-disable no-console */

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
import { type } from '@lowdefy/helpers';

import createFileLoader from './loaders/fileLoader';
import createFileSetter from './loaders/fileSetter';
import createMetaLoader from './loaders/metaLoader';

import buildConnections from './build/buildConnections';
import buildMenu from './build/buildMenu';
import buildPages from './build/buildPages';
import buildRefs from './build/buildRefs';
import cleanOutputDirectory from './build/cleanOutputDirectory';
import testSchema from './build/testSchema';
import writeConnections from './build/writeConnections';
import writeGlobal from './build/writeGlobal';
import writeMenus from './build/writeMenus';
import writePages from './build/writePages';
import writeRequests from './build/writeRequests';

function createContext(bootstrapContext) {
  const { logger, cacheDirectory, configDirectory, outputDirectory } = bootstrapContext;
  if (!type.isFunction(logger.success)) {
    logger.success = logger.log;
  }
  const context = {
    logger,
    configLoader: createFileLoader({ baseDirectory: configDirectory }),
    artifactSetter: createFileSetter({ baseDirectory: outputDirectory }),
    outputDirectory,
    cacheDirectory,
  };
  return context;
}

async function build() {
  const bootstrapContext = {
    logger: console,
    cacheDirectory: path.resolve(process.cwd(), '/.lowdefy/.cache'),
    configDirectory: process.cwd(),
    outputDirectory: path.resolve(process.cwd(), '/.lowdefy/build'),
  };
  const context = createContext(bootstrapContext);
  try {
    let components = await buildRefs({ context });
    await testSchema({ components, context });
    context.metaLoader = createMetaLoader({ components, context });
    await buildConnections({ components, context });
    await buildPages({ components, context });
    await buildMenu({ components, context });
    await cleanOutputDirectory({ context });
    await writeConnections({ components, context });
    await writeRequests({ components, context });
    await writePages({ components, context });
    await writeGlobal({ components, context });
    await writeMenus({ components, context });
  } catch (error) {
    context.logger.error(error);
    throw error;
  }
}

export { createContext };

export default build;
