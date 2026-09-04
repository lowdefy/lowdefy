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

import validateBlockMeta from '../writePluginImports/validateBlockMeta.js';

/**
 * Adds the file blocks to context.blockSchemas and context.blockPluginMetas,
 * the maps loadBlockSchemas builds for package blocks.
 *
 * A block schema must be in context before any block is built, because
 * validateBlockProperties reads it, so a file block that only reached the
 * schema-map writer would be built without its properties ever being checked.
 * The meta is held to the same contract a package block's meta is: the sibling
 * JSON is where a file block declares it.
 */
function loadFilePluginBlockSchemas({ context }) {
  for (const record of context.filePlugins ?? []) {
    if (record.kind !== 'blocks') continue;
    const valid = validateBlockMeta({
      context,
      filePlugin: record,
      meta: record.meta,
      typeName: record.typeName,
    });
    if (!valid) continue;
    context.blockSchemas[record.typeName] = record.schema ?? buildBlockSchema(record.meta);
    context.blockPluginMetas[record.typeName] = record.meta;
  }
}

export default loadFilePluginBlockSchemas;
