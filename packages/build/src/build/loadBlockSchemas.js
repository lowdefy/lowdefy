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

import { buildBlockSchema } from '@lowdefy/block-utils';

import importPluginModule from './writePluginImports/importPluginModule.js';
import validateBlockMeta from './writePluginImports/validateBlockMeta.js';

// Builds context.blockSchemas ({ [typeName]: full block schema }) and
// context.blockPluginMetas ({ [typeName]: plugin meta }) for every installed
// block type before any page is built. The used types are not known until
// buildPages runs, so every installed block package's metas module is imported
// once here and shared with writeBlockSchemaMap in the write phase.
async function loadBlockSchemas({ components, context }) {
  const blockSchemas = {};
  const blockPluginMetas = {};
  const typesMapSchemas = context.typesMap.schemas?.blocks ?? {};

  const typesByPackage = {};
  for (const [typeName, definition] of Object.entries(context.typesMap.blocks ?? {})) {
    if (!typesByPackage[definition.package]) {
      typesByPackage[definition.package] = [];
    }
    typesByPackage[definition.package].push({ typeName, definition });
  }

  for (const [packageName, types] of Object.entries(typesByPackage)) {
    let packageMetas = await importPluginModule({ context, specifier: `${packageName}/metas` });
    if (!packageMetas) {
      packageMetas = await importPluginModule({ context, specifier: `${packageName}/schemas` });
    }
    for (const { typeName, definition } of types) {
      if (typesMapSchemas[typeName]) {
        blockSchemas[typeName] = typesMapSchemas[typeName];
      }
      // A package whose metas module cannot be resolved is not installed yet:
      // the first build of an app that adds a plugin runs before installServer
      // fetches it, and the CLI and dev manager build again afterwards. Only a
      // package that does export metas is held to the meta contract.
      if (!packageMetas) {
        continue;
      }
      const meta = packageMetas[definition.originalTypeName ?? typeName];
      const valid = validateBlockMeta({ meta, typeName, packageName, context });
      if (!valid) {
        continue;
      }
      if (!typesMapSchemas[typeName]) {
        blockSchemas[typeName] = buildBlockSchema(meta);
      }
      blockPluginMetas[typeName] = meta;
    }
  }

  context.blockSchemas = blockSchemas;
  context.blockPluginMetas = blockPluginMetas;
  return components;
}

export default loadBlockSchemas;
