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

import { type } from '@lowdefy/helpers';

// `set` writes a block's value through the engine, which only input blocks
// have, and a block is an input block exactly when its meta carries a
// valueType (packages/build/src/build/writePluginImports/writeBlockSchemaMap.js).
// The trace names a block, not its type, so the type comes from the build's
// blockTypes map; a trace line that carries `block_type` is believed first, so
// a compile with no build artefacts to hand still works.
function resolveValueType({ blockMetas = {}, blockTypes = {}, event }) {
  const blockType = event.block_type ?? blockTypes[`${event.page_id}.${event.block_id}`];
  if (!type.isString(blockType)) return undefined;
  const valueType = blockMetas[blockType]?.valueType;
  return type.isString(valueType) ? valueType : undefined;
}

export default resolveValueType;
