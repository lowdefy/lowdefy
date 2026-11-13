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

// Every block of a page context in tree order, and by id the block that holds it (null for the
// page's root block), walking the slots as the web client renders them: a block's subSlots hold
// its children, one Slots per list row. Returns { blocks, parents }.
function collectBlockParents({ context }) {
  const blocks = [];
  const parents = new Map();
  function walk({ parent, slots }) {
    Object.values(slots.slots).forEach((slot) => {
      slot.blocks.forEach((block) => {
        blocks.push(block);
        parents.set(block.id, parent);
        (slots.subSlots[block.id] ?? []).forEach((subSlots) => {
          walk({ parent: block, slots: subSlots });
        });
      });
    });
  }
  walk({ parent: null, slots: context._internal.RootSlots });
  return { blocks, parents };
}

export default collectBlockParents;
