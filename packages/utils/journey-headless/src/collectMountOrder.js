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

// The blocks of a page in the order React mounts them, so in the order their onMount fires: a
// block's children before the block (effects run child first), each slot's blocks in config
// order. The web client renders every block (Block.js mounts it whatever its visibility), but a
// hidden block renders no children (CategorySwitch), so a hidden block's subtree is left out.
// A list's rows are its subSlots, one per row; a modal's or drawer's content is mounted only while
// it is open, which the runner's block method stand-ins will follow.
function collectMountOrder({ slots }) {
  return Object.values(slots.slots).flatMap((slot) =>
    slot.blocks.flatMap((block) => {
      const children =
        block.eval?.visible === false
          ? []
          : (slots.subSlots[block.id] ?? []).flatMap((subSlots) =>
              collectMountOrder({ slots: subSlots })
            );
      return [...children, block];
    })
  );
}

export default collectMountOrder;
