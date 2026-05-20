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

function getBlocksArray(container) {
  if (!container) return [];
  if (Array.isArray(container)) return container;
  if (container['~arr']) return container['~arr'];
  return [];
}

function extractBlockMap({ pageConfig, typesBlocks, blockMetas = {} }) {
  const blockMap = {};

  function traverse(obj, prefix) {
    if (!obj || typeof obj !== 'object') return;

    let nextPrefix = prefix;

    // If this object has blockId and type, record it under prefix + blockId.
    // List-category blocks (category: 'list' on their meta) iterate their slot children
    // at runtime under {blockId}.{index}.{childId}, so we record children under the
    // template id `{blockId}.$.{childId}` and downstream resolves numeric runtime
    // segments back to `$` for lookup.
    if (obj.blockId && obj.type) {
      const packageName = typesBlocks[obj.type]?.package;
      if (packageName) {
        blockMap[`${prefix}${obj.blockId}`] = {
          type: obj.type,
          helper: `${packageName}/e2e`,
        };
      }
      if (blockMetas[obj.type]?.category === 'list') {
        nextPrefix = `${prefix}${obj.blockId}.$.`;
      }
    }

    // Traverse slots - slot.blocks is { "~arr": [...blocks...] }
    if (obj.slots) {
      Object.values(obj.slots).forEach((slot) => {
        getBlocksArray(slot.blocks).forEach((block) => traverse(block, nextPrefix));
      });
    }

    // Traverse areas - area.blocks is { "~arr": [...blocks...] }
    if (obj.areas) {
      Object.values(obj.areas).forEach((area) => {
        getBlocksArray(area.blocks).forEach((block) => traverse(block, nextPrefix));
      });
    }

    // Traverse direct blocks array (may also be { "~arr": [...] })
    if (obj.blocks) {
      getBlocksArray(obj.blocks).forEach((block) => traverse(block, nextPrefix));
    }
  }

  traverse(pageConfig, '');
  return blockMap;
}

export default extractBlockMap;
