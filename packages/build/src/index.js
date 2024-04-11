/* eslint-disable no-console */

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

import createContext from './createContext.js';
import createPluginTypesMap from './utils/createPluginTypesMap.js';

import addDefaultPages from './build/addDefaultPages/addDefaultPages.js';
import addKeys from './build/addKeys.js';
import buildApp from './build/buildApp.js';
import buildAuth from './build/buildAuth/buildAuth.js';
import buildConnections from './build/buildConnections.js';
import buildImports from './build/buildImports/buildImports.js';
import buildJs from './build/buildJs/buildJs.js';
import buildMenu from './build/buildMenu.js';
import buildPages from './build/buildPages/buildPages.js';
import buildRefs from './build/buildRefs/buildRefs.js';
import buildTypes from './build/buildTypes.js';
import cleanBuildDirectory from './build/cleanBuildDirectory.js';
import copyPublicFolder from './build/copyPublicFolder.js';
import testSchema from './build/testSchema.js';
import updateServerPackageJson from './build/updateServerPackageJson.js';
import validateConfig from './build/validateConfig.js';
import writeApp from './build/writeApp.js';
import writeAuth from './build/writeAuth.js';
import writeConfig from './build/writeConfig.js';
import writeConnections from './build/writeConnections.js';
import writeGlobal from './build/writeGlobal.js';
import writeJs from './build/buildJs/writeJs.js';
import writeMaps from './build/writeMaps.js';
import writeMenus from './build/writeMenus.js';
import writePages from './build/writePages.js';
import writePluginImports from './build/writePluginImports/writePluginImports.js';
import writeRequests from './build/writeRequests.js';
import writeTypes from './build/writeTypes.js';

async function build(options) {
  const context = createContext(options);
  const components = await buildRefs({ context });
  testSchema({ components, context });
  buildApp({ components, context });
  validateConfig({ components, context });
  addDefaultPages({ components, context });
  buildAuth({ components, context });
  buildConnections({ components, context });
  buildPages({ components, context });
  buildMenu({ components, context });
  buildJs({ components, context });
  addKeys({ components, context });
  buildTypes({ components, context });
  buildImports({ components, context });
  await cleanBuildDirectory({ context });
  await writeApp({ components, context });
  await writeAuth({ components, context });
  await writeConnections({ components, context });
  await writeRequests({ components, context });
  await writePages({ components, context });
  await writeConfig({ components, context });
  await writeGlobal({ components, context });
  await writeMaps({ components, context });
  await writeMenus({ components, context });
  await writeTypes({ components, context });
  await writePluginImports({ components, context });
  await writeJs({ components, context });
  await updateServerPackageJson({ components, context });
  await copyPublicFolder({ components, context });
}

export { createPluginTypesMap };

export default build;
