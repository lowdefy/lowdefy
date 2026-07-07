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

async function getBlockSchemasAndMetas({ blocks, typesMap }) {
  const schemas = {};
  const allMetas = {};

  const typesMapSchemas = typesMap.schemas?.blocks ?? {};

  const blocksByPackage = {};
  for (const block of blocks) {
    if (!blocksByPackage[block.package]) {
      blocksByPackage[block.package] = [];
    }
    blocksByPackage[block.package].push(block);
  }

  for (const [packageName, packageBlocks] of Object.entries(blocksByPackage)) {
    let packageMetas;
    try {
      packageMetas = await import(/* webpackIgnore: true */ /* @vite-ignore */ `${packageName}/metas`);
    } catch {
      try {
        packageMetas = await import(/* webpackIgnore: true */ /* @vite-ignore */ `${packageName}/schemas`);
      } catch {
        // Package not resolvable from build context (custom plugins) — skip
      }
    }
    for (const block of packageBlocks) {
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
  const typesMapBlockMetas = typesMap.blockMetas ?? {};
  for (const block of blocks) {
    const typesMapMeta = typesMapBlockMetas[block.typeName];
    const meta = allMetas[block.typeName];
    if (typesMapMeta) {
      blockMetas[block.typeName] = {
        category: typesMapMeta.category,
        ...(typesMapMeta.valueType != null && { valueType: typesMapMeta.valueType }),
        ...(typesMapMeta.initValue !== undefined && { initValue: typesMapMeta.initValue }),
      };
    } else if (meta) {
      blockMetas[block.typeName] = {
        category: meta.category,
        ...(meta.valueType != null && { valueType: meta.valueType }),
        ...(meta.initValue !== undefined && { initValue: meta.initValue }),
      };
    }
  }

  return { schemas, blockMetas };
}

export default getBlockSchemasAndMetas;
