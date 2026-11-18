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
import findContentTrigger from './findContentTrigger.js';
import isClickClaimed from './isClickClaimed.js';
import leaveDropdowns from './leaveDropdowns.js';
import readStandInState from './readStandInState.js';

// A click the pointer makes on `block`, in the browser's order. Every other open dropdown hears
// the pointer leave it first (leaveDropdowns). Then `click` runs, what the click does on the block
// itself (its onClick). Then the closest dropdown whose content holds the block hears the click on
// its trigger, which its content is (its stand-in's clickContent): the click bubbles out to the
// trigger, and a hover dropdown opens only after its mouse-enter delay. The dropdown's events for
// it run unless a block on the way handled the click (isClickClaimed). A dropdown the click took
// away (a Modal holding it closed and unmounted it, a link left the page) is gone, and hears
// nothing.
async function pointerClick({ actor, block, click }) {
  const trigger = findContentTrigger({ actor, block });
  const state = trigger === null ? null : readStandInState({ actor, block: trigger });
  leaveDropdowns({ actor, except: trigger, targetBlock: block });
  await click?.();
  if (trigger === null || actor.page.standIns.get(trigger.id)?.state !== state) {
    return;
  }
  await BLOCK_STAND_INS[trigger.type].clickContent({
    actor,
    block: trigger,
    claimed: isClickClaimed({ actor, block, container: trigger }),
    state,
  });
}

export default pointerClick;
