/* eslint-disable no-console */

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

import { readFile } from '@lowdefy/node-utils';

import createCounter from './utils/createCounter.js';
import createReadConfigFile from './utils/files/readConfigFile.js';
import createWriteBuildArtifact from './utils/files/writeBuildArtifact.js';

import addDefaultPages from './build/addDefaultPages/addDefaultPages.js';
import buildAuth from './build/buildAuth/buildAuth.js';
import buildConnections from './build/buildConnections.js';
import buildMenu from './build/buildMenu.js';
import buildPages from './build/buildPages/buildPages.js';
import buildRefs from './build/buildRefs/buildRefs.js';
import buildTypes from './build/buildTypes.js';
import cleanBuildDirectory from './build/cleanBuildDirectory.js';
import testSchema from './build/testSchema.js';
import validateApp from './build/validateApp.js';
import validateConfig from './build/validateConfig.js';
import writeApp from './build/writeApp.js';
import writeBlockImports from './build/writePluginImports/writeBlockImports.js';
import writeConnectionImports from './build/writePluginImports/writeConnectionImports.js';
import writeConfig from './build/writeConfig.js';
import writeConnections from './build/writeConnections.js';
import writeGlobal from './build/writeGlobal.js';
import writeMenus from './build/writeMenus.js';
import writePages from './build/writePages.js';
import writeRequests from './build/writeRequests.js';
import writeTypes from './build/writeTypes.js';

async function createContext(options) {
  const { blocksServerUrl, buildDirectory, cacheDirectory, configDirectory, logger, refResolver } =
    options;

  const defaultTypes = JSON.parse(
    await readFile(new URL('./defaultTypes.json', import.meta.url).pathname)
  );

  // TODO: resolve custom plugin types

  const context = {
    blocksServerUrl,
    buildDirectory,
    cacheDirectory,
    configDirectory,
    typeCounters: {
      actions: createCounter(),
      blocks: createCounter(),
      connections: createCounter(),
      requests: createCounter(),
      operators: {
        client: createCounter(),
        server: createCounter(),
      },
    },
    logger,
    readConfigFile: createReadConfigFile({ configDirectory }),
    refResolver,
    types: defaultTypes,
    writeBuildArtifact: createWriteBuildArtifact({ buildDirectory }),
  };
  return context;
}

async function build(options) {
  const context = await createContext(options);
  try {
    let components = await buildRefs({ context });
    await testSchema({ components, context });
    await validateApp({ components, context });
    await validateConfig({ components, context });
    await addDefaultPages({ components, context });
    await buildAuth({ components, context });
    await buildConnections({ components, context });
    await buildPages({ components, context });
    await buildMenu({ components, context });
    await buildTypes({ components, context });
    await cleanBuildDirectory({ context });
    await writeApp({ components, context });
    await writeConnections({ components, context });
    await writeRequests({ components, context });
    await writePages({ components, context });
    await writeConfig({ components, context });
    await writeGlobal({ components, context });
    await writeMenus({ components, context });
    await writeTypes({ components, context });
    await writeBlockImports({ components, context });
    await writeConnectionImports({ components, context });
    // TODO: write style file
    // TODO: write icons file
    // TODO: add plugins to package.json
  } catch (error) {
    context.logger.error(error);
    throw error;
  }
}

export { createContext };

export default build;
