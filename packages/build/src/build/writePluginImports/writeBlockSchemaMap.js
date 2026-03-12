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
    let packageMetas;
    try {
      packageMetas = await import(/* webpackIgnore: true */ `${packageName}/metas`);
    } catch {
      try {
        packageMetas = await import(/* webpackIgnore: true */ `${packageName}/schemas`);
      } catch {
        // Package not resolvable from build context (custom plugins) — skip
      }
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
  for (const [typeName, meta] of Object.entries(allMetas)) {
    blockMetas[typeName] = {
      category: meta.category,
      ...(meta.valueType != null && { valueType: meta.valueType }),
      ...(meta.initValue !== undefined && { initValue: meta.initValue }),
    };
  }

  await context.writeBuildArtifact('plugins/blockSchemas.json', JSON.stringify(schemas));
  await context.writeBuildArtifact('plugins/blockMetas.json', JSON.stringify(blockMetas));
}

export default writeBlockSchemaMap;
