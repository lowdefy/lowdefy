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

import BLOCK_STAND_INS from './BLOCK_STAND_INS.js';
import collectBlockParents from './collectBlockParents.js';
import POPUP_BLOCK_TYPES from './POPUP_BLOCK_TYPES.js';

// The closest block holding `block` whose content is its trigger (its stand-in has clickContent:
// a DropdownMenu), or null: a click on `block` reaches that trigger too (pointerClick), so the
// data-set rails check both. A Modal, Drawer or ConfirmModal draws its content in a portal
// outside the blocks around it, so a click inside one never reaches a trigger further out.
function findContentTrigger({ actor, block }) {
  const { parents } = collectBlockParents({ context: actor.page.context });
  let current = parents.get(block.id);
  while (current) {
    if (BLOCK_STAND_INS[current.type]?.clickContent) {
      return current;
    }
    if (POPUP_BLOCK_TYPES.has(current.type)) {
      return null;
    }
    current = parents.get(current.id);
  }
  return null;
}

export default findContentTrigger;
