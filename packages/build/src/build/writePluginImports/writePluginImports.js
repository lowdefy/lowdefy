/*
  Copyright 2020-2026 Lowdefy, Inc

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

import writeActionImports from './writeActionImports.js';
import writeActionSchemaMap from './writeActionSchemaMap.js';
import writeAgentImports from './writeAgentImports.js';
import writeAuthImports from './writeAuthImports.js';
import writeAvailableTypes from './writeAvailableTypes.js';
import writeBlockImports from './writeBlockImports.js';
import writeBlockSchemaMap from './writeBlockSchemaMap.js';
import writeConnectionImports from './writeConnectionImports.js';
import writeConnectionSchemaMap from './writeConnectionSchemaMap.js';
import writeIconImports from './writeIconImports.js';
import writeNotificationImports from './writeNotificationImports.js';
import writeOperatorImports from './writeOperatorImports.js';
import writeOperatorSchemaMap from './writeOperatorSchemaMap.js';
import writePageImports from './writePageImports.js';
import validatePluginApiVersions from './validatePluginApiVersions.js';
import writeStepImports from './writeStepImports.js';
import writeWebsocketImports from './writeWebsocketImports.js';
import writeServerFilePlugins from './writeServerFilePlugins.js';
import writeGlobalsCss from './writeGlobalsCss.js';

async function writePluginImports({ components, context }) {
  validatePluginApiVersions({ components, context });
  await writeActionImports({ components, context });
  await writeActionSchemaMap({ components, context });
  await writeAgentImports({ components, context });
  await writeAuthImports({ components, context });
  await writeBlockImports({ components, context });
  await writeBlockSchemaMap({ components, context });
  await writeConnectionImports({ components, context });
  await writeConnectionSchemaMap({ context });
  await writeIconImports({ components, context });
  await writeNotificationImports({ components, context });
  await writeOperatorImports({ components, context });
  await writeOperatorSchemaMap({ components, context });
  await writePageImports({ components, context });
  await writeStepImports({ components, context });
  await writeWebsocketImports({ components, context });
  await writeAvailableTypes({ context });
  await writeServerFilePlugins({ context });
  await writeGlobalsCss({ components, context });

  // Write block package names — available as a vite.config.js escape hatch
  // (optimizeDeps/noExternal lists) for packages that don't resolve cleanly.
  const blockPackages = [...new Set((components.imports.blocks ?? []).map((b) => b.package))];
  await context.writeBuildArtifact('blockPackages.json', JSON.stringify(blockPackages));
}

export default writePluginImports;
