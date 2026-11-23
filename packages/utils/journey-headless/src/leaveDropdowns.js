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

// Before a click, open or select acts on targetBlock, every dropdown open on the page but
// `except` (the block whose own stand-in takes the step) hears the pointer leave it, as a click
// outside or the mouse leaving does in a browser: its stand-in closes it, firing its
// onOpenChange { open: false }. A fill or press moves no pointer and leaves it open. Resolves once
// what each leave returns resolves: a searching selector clears its search on the pointer's
// mousedown, so its onSearch runs before the click that follows unless a debounce delays it.
async function leaveDropdowns({ actor, except, targetBlock }) {
  const left = [];
  actor.page.standIns.forEach(({ block, state }) => {
    if (state.open !== true || block === except) {
      return;
    }
    left.push(BLOCK_STAND_INS[block.type]?.leave?.({ actor, block, state, targetBlock }));
  });
  await Promise.all(left);
}

export default leaveDropdowns;
