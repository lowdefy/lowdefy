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

// Writes plugins/blockSchemas.json and plugins/blockMetas.json for the block
// types the app uses. The schema and meta maps are built for every installed
// type by loadBlockSchemas before the pages are built.
async function writeBlockSchemaMap({ components, context }) {
  const schemas = {};
  const blockMetas = {};
  const blockSchemas = context.blockSchemas ?? {};
  const blockPluginMetas = context.blockPluginMetas ?? {};
  const typesMapBlockMetas = context.typesMap.blockMetas ?? {};

  for (const block of components.imports.blocks) {
    if (blockSchemas[block.typeName]) {
      schemas[block.typeName] = blockSchemas[block.typeName];
    }
    const typesMapMeta = typesMapBlockMetas[block.typeName];
    const pluginMeta = blockPluginMetas[block.typeName];
    const meta = typesMapMeta ?? pluginMeta;
    if (meta) {
      // typesMap block metas come from extractBlockTypes (block-utils), which
      // keeps only what the client needs - hazards are read from the plugin's
      // own meta module, the same source as the schema.
      blockMetas[block.typeName] = {
        category: meta.category,
        ...(meta.valueType != null && { valueType: meta.valueType }),
        ...(meta.initValue !== undefined && { initValue: meta.initValue }),
        hazards: typesMapMeta?.hazards ?? pluginMeta?.hazards ?? [],
      };
    }
  }

  await context.writeBuildArtifact('plugins/blockSchemas.json', JSON.stringify(schemas));
  await context.writeBuildArtifact('plugins/blockMetas.json', JSON.stringify(blockMetas));
}

export default writeBlockSchemaMap;
