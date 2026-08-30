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

import importPluginModule from './importPluginModule.js';

async function writeBlockSchemaMap({ components, context }) {
  const schemas = {};
  const allMetas = {};

  const typesMapSchemas = context.typesMap.schemas?.blocks ?? {};

  const blocksByPackage = {};
  for (const block of components.imports.blocks) {
    if (!blocksByPackage[block.package]) {
      blocksByPackage[block.package] = [];
    }
    blocksByPackage[block.package].push(block);
  }

  for (const [packageName, blocks] of Object.entries(blocksByPackage)) {
    let packageMetas = await importPluginModule({ context, specifier: `${packageName}/metas` });
    if (!packageMetas) {
      packageMetas = await importPluginModule({ context, specifier: `${packageName}/schemas` });
    }
    for (const block of blocks) {
      const meta = packageMetas?.[block.originalTypeName];
      if (typesMapSchemas[block.typeName]) {
        schemas[block.typeName] = typesMapSchemas[block.typeName];
      } else if (meta) {
        schemas[block.typeName] = buildBlockSchema(meta);
      }
      if (meta) {
        allMetas[block.typeName] = meta;
      }
    }
  }

  const blockMetas = {};
  const typesMapBlockMetas = context.typesMap.blockMetas ?? {};
  for (const block of components.imports.blocks) {
    const typesMapMeta = typesMapBlockMetas[block.typeName];
    const meta = allMetas[block.typeName];
    if (typesMapMeta) {
      // typesMap block metas come from extractBlockTypes (block-utils), which
      // keeps only what the client needs — hazards are read from the plugin's
      // own meta module, the same source as the schema.
      blockMetas[block.typeName] = {
        category: typesMapMeta.category,
        ...(typesMapMeta.valueType != null && { valueType: typesMapMeta.valueType }),
        ...(typesMapMeta.initValue !== undefined && { initValue: typesMapMeta.initValue }),
        hazards: typesMapMeta.hazards ?? meta?.hazards ?? [],
      };
    } else if (meta) {
      blockMetas[block.typeName] = {
        category: meta.category,
        ...(meta.valueType != null && { valueType: meta.valueType }),
        ...(meta.initValue !== undefined && { initValue: meta.initValue }),
        hazards: meta.hazards ?? [],
      };
    }
  }

  await context.writeBuildArtifact('plugins/blockSchemas.json', JSON.stringify(schemas));
  await context.writeBuildArtifact('plugins/blockMetas.json', JSON.stringify(blockMetas));
}

export default writeBlockSchemaMap;
