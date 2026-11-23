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

// Before a fill types into `except`, every other block whose stand-in keeps a focus it can lose
// (a searching selector's search box) hears it blur, as the focus moving to the filled input does
// in a browser: a searching selector closes its dropdown and clears its search. A click, open or
// select elsewhere does the same through leaveDropdowns. Resolves once the events a blur returns
// have finished, before the fill types.
async function blurInputs({ actor, except }) {
  const blurred = [];
  actor.page.standIns.forEach(({ block, state }) => {
    if (block === except) {
      return;
    }
    blurred.push(BLOCK_STAND_INS[block.type]?.blur?.({ actor, block, state }));
  });
  await Promise.all(blurred);
}

export default blurInputs;
