/*
  Copyright 2020-2024 Lowdefy, Inc

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

function extractBlockMap({ pageConfig, typesBlocks }) {
  const blockMap = {};

  function traverse(obj) {
    if (!obj || typeof obj !== 'object') return;

    // If this object has blockId and type, record it
    if (obj.blockId && obj.type) {
      const packageName = typesBlocks[obj.type]?.package;
      if (packageName) {
        blockMap[obj.blockId] = {
          type: obj.type,
          helper: `${packageName}/e2e/${obj.type}`,
        };
      }
    }

    // Traverse areas - area.blocks is { "~arr": [...blocks...] }
    if (obj.areas) {
      Object.values(obj.areas).forEach((area) => {
        const blocks = getBlocksArray(area.blocks);
        blocks.forEach((block) => traverse(block));
      });
    }

    // Traverse direct blocks array (may also be { "~arr": [...] })
    if (obj.blocks) {
      const blocks = getBlocksArray(obj.blocks);
      blocks.forEach((block) => traverse(block));
    }
  }

  traverse(pageConfig);
  return blockMap;
}

export default extractBlockMap;
