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
import leaveDropdowns from './leaveDropdowns.js';
import readStandInState from './readStandInState.js';

// The closest block holding `block` whose content is its trigger (its stand-in has clickContent:
// a DropdownMenu), or null.
function findContentTrigger({ actor, block }) {
  const { parents } = collectBlockParents({ context: actor.page.context });
  let current = parents.get(block.id);
  while (current) {
    if (BLOCK_STAND_INS[current.type]?.clickContent) {
      return current;
    }
    current = parents.get(current.id);
  }
  return null;
}

// What the pointer does on a plain click on `block`, before the block's own click: every other
// open dropdown hears it leave (leaveDropdowns), and the closest dropdown whose content holds the
// block hears a click on its trigger, which its content is (its stand-in's clickContent): a closed
// one opens and fires onOpenChange first, an open click dropdown closes. A disabled block takes no
// click, so no trigger hears one.
async function pointerClick({ actor, block }) {
  const trigger =
    block.eval.properties?.disabled === true ? null : findContentTrigger({ actor, block });
  leaveDropdowns({ actor, except: trigger, targetBlock: block });
  if (trigger === null) {
    return;
  }
  await BLOCK_STAND_INS[trigger.type].clickContent({
    actor,
    block: trigger,
    state: readStandInState({ actor, block: trigger }),
  });
}

export default pointerClick;
