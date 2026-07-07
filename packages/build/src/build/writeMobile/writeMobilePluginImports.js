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

import generateImportFile from '../writePluginImports/generateImportFile.js';
import generateIconImportFile from '../writePluginImports/generateIconImportFile.js';
import generateJsFile from '../buildJs/generateJsFile.js';
import getBlockSchemasAndMetas from '../writePluginImports/getBlockSchemasAndMetas.js';

async function writeMobilePluginImports({ components, context }) {
  const imports = components.importsMobile;

  await context.writeBuildArtifact(
    'mobile/plugins/blocks.js',
    generateImportFile({
      imports: imports.blocks,
      importPath: 'blocks',
    })
  );

  const { schemas, blockMetas } = await getBlockSchemasAndMetas({
    blocks: imports.blocks,
    typesMap: context.typesMapMobile,
  });
  await context.writeBuildArtifact('mobile/plugins/blockSchemas.json', JSON.stringify(schemas));
  await context.writeBuildArtifact('mobile/plugins/blockMetas.json', JSON.stringify(blockMetas));

  await context.writeBuildArtifact(
    'mobile/plugins/actions.js',
    generateImportFile({
      imports: imports.actions,
      importPath: 'actions',
    })
  );

  await context.writeBuildArtifact(
    'mobile/plugins/icons.js',
    generateIconImportFile({ packages: imports.icons })
  );

  await context.writeBuildArtifact(
    'mobile/plugins/operators/client.js',
    generateImportFile({
      imports: imports.operators.client,
      importPath: 'operators/client',
    })
  );

  // Same client jsMap as the web bundle — _js functions are keyed globally,
  // so mobile pages' functions are included; unused entries are inert. Apps
  // without a mobile key get an empty map instead of a web duplicate.
  await context.writeBuildArtifact(
    'mobile/plugins/operators/clientJsMap.js',
    generateJsFile({
      map: components.mobile?.configured === true ? context.jsMap.client : {},
      functionPrototype: `{ actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user }`,
    })
  );

  // Block package names — vite.config escape hatch, mirrors blockPackages.json.
  const blockPackages = [...new Set((imports.blocks ?? []).map((b) => b.package))];
  await context.writeBuildArtifact('mobile/blockPackages.json', JSON.stringify(blockPackages));
}

export default writeMobilePluginImports;
