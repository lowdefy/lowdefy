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
import readStandInState from './readStandInState.js';

const LIST_METHODS = ['moveItemDown', 'moveItemUp', 'pushItem', 'removeItem', 'unshiftItem'];

// Registers the block methods a block's component registers in the browser, which CallMethod
// calls, so a headless page answers them: a block's stand-in registers its own (a Modal's or
// Drawer's setOpen and toggleOpen, a ConfirmModal's open; BLOCK_STAND_INS), and a list block's
// item methods are its own engine methods, as the List component registers them. A method no
// stand-in registers fails CallMethod, which names the block and the method. Run again after the
// page changes, since list rows add blocks.
function registerBlockStandIns({ actor }) {
  const { context } = actor.page;
  const { blockMetas } = context._internal.lowdefy._internal;
  collectBlockParents({ context }).blocks.forEach((block) => {
    const standIn = BLOCK_STAND_INS[block.type];
    if (standIn?.registerMethods) {
      standIn.registerMethods({ actor, block, state: readStandInState({ actor, block }) });
      return;
    }
    if (blockMetas[block.type]?.category === 'list') {
      LIST_METHODS.forEach((method) => block.registerMethod(method, block[method]));
    }
  });
}

export default registerBlockStandIns;
