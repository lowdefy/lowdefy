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

import { checkHeadlessMethods, checkHeadlessText } from '@lowdefy/block-utils';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import loadPluginTypeSchema from './loadPluginTypeSchema.js';

// A bad headlessMethods or headlessText declaration is a mistake in the plugin's meta, so it fails
// the build as a ConfigError, not as a Lowdefy internal error.
function checkBlockHeadlessMethods({ block, headlessMethods }) {
  try {
    checkHeadlessMethods({ blockType: block.typeName, headlessMethods });
  } catch (error) {
    throw new ConfigError(error.message, { received: headlessMethods });
  }
}

function checkBlockHeadlessText({ block, headlessText }) {
  try {
    checkHeadlessText({ blockType: block.typeName, headlessText });
  } catch (error) {
    throw new ConfigError(error.message, { received: headlessText });
  }
}

async function writeBlockSchemaMap({ components, context }) {
  const schemas = {};
  const allMetas = {};

  const blocksByPackage = {};
  for (const block of components.imports.blocks) {
    if (!blocksByPackage[block.package]) {
      blocksByPackage[block.package] = [];
    }
    blocksByPackage[block.package].push(block);
  }

  for (const blocks of Object.values(blocksByPackage)) {
    for (const block of blocks) {
      const { schema, meta } = await loadPluginTypeSchema({ context, kind: 'blocks', type: block });
      if (schema) {
        schemas[block.typeName] = schema;
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
      // headlessMethods ({ [method]: the event it fires, or null for a no-op }) is what a headless
      // journey runs for a CallMethod on a block with no stand-in (@lowdefy/journey-headless
      // registerBlockStandIns). A declaration that is neither fails the build, naming the block
      // type and the method (checkBlockHeadlessMethods).
      // headlessText (the property paths the block draws as text) is what a headless journey reads
      // as the text of a block it has no text model for (@lowdefy/journey-headless readTextModel).
      const headlessMethods = typesMapMeta.headlessMethods ?? meta?.headlessMethods;
      const headlessText = typesMapMeta.headlessText ?? meta?.headlessText;
      checkBlockHeadlessMethods({ block, headlessMethods });
      checkBlockHeadlessText({ block, headlessText });
      blockMetas[block.typeName] = {
        category: typesMapMeta.category,
        ...(!type.isNone(typesMapMeta.valueType) && { valueType: typesMapMeta.valueType }),
        ...(typesMapMeta.initValue !== undefined && { initValue: typesMapMeta.initValue }),
        hazards: typesMapMeta.hazards ?? meta?.hazards ?? [],
        ...(!type.isNone(headlessMethods) && { headlessMethods }),
        ...(!type.isNone(headlessText) && { headlessText }),
      };
    } else if (meta) {
      checkBlockHeadlessMethods({ block, headlessMethods: meta.headlessMethods });
      checkBlockHeadlessText({ block, headlessText: meta.headlessText });
      blockMetas[block.typeName] = {
        category: meta.category,
        ...(!type.isNone(meta.valueType) && { valueType: meta.valueType }),
        ...(meta.initValue !== undefined && { initValue: meta.initValue }),
        hazards: meta.hazards ?? [],
        ...(!type.isNone(meta.headlessMethods) && { headlessMethods: meta.headlessMethods }),
        ...(!type.isNone(meta.headlessText) && { headlessText: meta.headlessText }),
      };
    }
  }

  await context.writeBuildArtifact('plugins/blockSchemas.json', JSON.stringify(schemas));
  await context.writeBuildArtifact('plugins/blockMetas.json', JSON.stringify(blockMetas));
}

export default writeBlockSchemaMap;
