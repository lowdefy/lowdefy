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

// The block of a built page with this blockId, children included, or null.
// Children sit in the blocks of each slot and area, as pageBlocks walks them.
function findPageBlock({ page, blockId }) {
  const containers = ['slots', 'areas'].flatMap((key) => Object.values(page[key] ?? {}));
  for (const container of containers) {
    for (const block of container?.blocks ?? []) {
      if (block.blockId === blockId) {
        return block;
      }
      const found = findPageBlock({ page: block, blockId });
      if (found !== null) {
        return found;
      }
    }
  }
  return null;
}

export default findPageBlock;
