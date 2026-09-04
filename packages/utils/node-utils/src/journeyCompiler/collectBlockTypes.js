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

function walk({ blocks, blockTypes, pageId }) {
  if (!type.isArray(blocks)) return;
  blocks.forEach((block) => {
    if (type.isNone(block)) return;
    if (type.isString(block.blockId) && type.isString(block.type)) {
      blockTypes[`${pageId}.${block.blockId}`] = block.type;
    }
    walk({ blocks: block.blocks, blockTypes, pageId });
    Object.values(block.areas ?? {}).forEach((area) =>
      walk({ blocks: area.blocks, blockTypes, pageId })
    );
    Object.values(block.slots ?? {}).forEach((slot) =>
      walk({ blocks: slot.blocks, blockTypes, pageId })
    );
  });
}

// `pageId.blockId` -> block type, read off a built page artifact. A trace names
// a block, `resolveValueType` needs its type, and only the build knows the two
// together. The CLI and the dev server load the artifact differently but read
// the same shape, so the traversal lives here rather than in both.
function collectBlockTypes({ blockTypes = {}, page, pageId }) {
  walk({ blocks: [page], blockTypes, pageId });
  return blockTypes;
}

export default collectBlockTypes;
