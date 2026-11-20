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

import POPUP_BLOCK_TYPES from './POPUP_BLOCK_TYPES.js';

// Whether a person would see a block, as far as the engine can tell without rendering: the block
// and every block that holds it are visible (visibleEval, not pixels), and every Modal or Drawer
// among them is open. openBlocks holds the ids of the open ones; parents is collectBlockParents'.
function isBlockShown({ block, openBlocks, parents }) {
  let current = block;
  while (!type.isNone(current)) {
    if (current.eval?.visible === false) {
      return false;
    }
    if (POPUP_BLOCK_TYPES.has(current.type) && !openBlocks.has(current.id)) {
      return false;
    }
    current = parents.get(current.id);
  }
  return true;
}

export default isBlockShown;
