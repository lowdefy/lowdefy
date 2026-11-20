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

import POPUP_BLOCK_TYPES from './POPUP_BLOCK_TYPES.js';

// Whether the web client renders a block's children: a hidden block renders none
// (CategorySwitch), and a closed Modal or Drawer renders its content only when forceRender is set.
function rendersChildren({ block, openBlocks }) {
  if (block.eval?.visible === false) {
    return false;
  }
  if (POPUP_BLOCK_TYPES.has(block.type) && !openBlocks.has(block.id)) {
    return block.eval?.properties?.forceRender === true;
  }
  return true;
}

// The blocks of a page in the order React mounts them, so in the order their onMount fires: a
// block's children before the block (effects run child first), each slot's blocks in config
// order. The web client mounts every block it reaches, whatever its visibility, but not the
// children of a block that renders none. openBlocks holds the ids of the open Modals and Drawers.
function collectMountOrder({ openBlocks = new Set(), slots }) {
  return Object.values(slots.slots).flatMap((slot) =>
    slot.blocks.flatMap((block) => {
      const children = rendersChildren({ block, openBlocks })
        ? (slots.subSlots[block.id] ?? []).flatMap((subSlots) =>
            collectMountOrder({ openBlocks, slots: subSlots })
          )
        : [];
      return [...children, block];
    })
  );
}

export default collectMountOrder;
