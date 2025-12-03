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

import createBuildProfiler from './utils/createBuildProfiler.js';
import createContext from './createContext.js';
import createPluginTypesMap from './utils/createPluginTypesMap.js';

import addDefaultPages from './build/addDefaultPages/addDefaultPages.js';
import addKeys from './build/addKeys.js';
import buildApp from './build/buildApp.js';
import buildAuth from './build/buildAuth/buildAuth.js';
import buildConnections from './build/buildConnections.js';
import buildApi from './build/buildApi/buildApi.js';
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
import writeApi from './build/writeApi.js';
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
  const { time, printSummary } = createBuildProfiler({ logger: context.logger });

  const components = await time('buildRefs', () => buildRefs({ context }));
  await time('testSchema', () => testSchema({ components, context }));
  await time('buildApp', () => buildApp({ components, context }));
  await time('validateConfig', () => validateConfig({ components, context }));
  await time('addDefaultPages', () => addDefaultPages({ components, context }));
  await time('buildAuth', () => buildAuth({ components, context }));
  await time('buildConnections', () => buildConnections({ components, context }));
  await time('buildApi', () => buildApi({ components, context }));
  await time('buildPages', () => buildPages({ components, context }));
  await time('buildMenu', () => buildMenu({ components, context }));
  await time('buildJs', () => buildJs({ components, context }));
  await time('addKeys', () => addKeys({ components, context }));
  await time('buildTypes', () => buildTypes({ components, context }));
  await time('buildImports', () => buildImports({ components, context }));
  await time('cleanBuildDirectory', () => cleanBuildDirectory({ context }));
  await time('writeApp', () => writeApp({ components, context }));
  await time('writeAuth', () => writeAuth({ components, context }));
  await time('writeConnections', () => writeConnections({ components, context }));
  await time('writeApi', () => writeApi({ components, context }));
  await time('writeRequests', () => writeRequests({ components, context }));
  await time('writePages', () => writePages({ components, context }));
  await time('writeConfig', () => writeConfig({ components, context }));
  await time('writeGlobal', () => writeGlobal({ components, context }));
  await time('writeMaps', () => writeMaps({ components, context }));
  await time('writeMenus', () => writeMenus({ components, context }));
  await time('writeTypes', () => writeTypes({ components, context }));
  await time('writePluginImports', () => writePluginImports({ components, context }));
  await time('writeJs', () => writeJs({ components, context }));
  await time('updateServerPackageJson', () => updateServerPackageJson({ components, context }));
  await time('copyPublicFolder', () => copyPublicFolder({ components, context }));

  printSummary();
}

export { createPluginTypesMap };

export default build;
