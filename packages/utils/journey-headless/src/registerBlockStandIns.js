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

import BLOCK_STAND_INS from './BLOCK_STAND_INS.js';
import collectBlockParents from './collectBlockParents.js';
import readStandInState from './readStandInState.js';
import leaveMethodsToBrowser from './standIns/leaveMethodsToBrowser.js';
import registerHeadlessMethods from './standIns/registerHeadlessMethods.js';

const LIST_METHODS = ['moveItemDown', 'moveItemUp', 'pushItem', 'removeItem', 'unshiftItem'];

// Registers the block methods a block's component registers in the browser, which CallMethod
// calls, so a headless page answers them: a block's stand-in registers its own (a Modal's or
// Drawer's setOpen and toggleOpen, a ConfirmModal's open; BLOCK_STAND_INS), and a list block's
// item methods are its own engine methods, as the List component registers them. A method a
// stand-in block's stand-in does not register fails CallMethod, which names the block and the
// method. A block whose type has no stand-in registers the methods its meta declares for a
// headless run (meta.headlessMethods: { [method]: the event it fires }; registerHeadlessMethods)
// and leaves every other method to the browser (leaveMethodsToBrowser): its component, which
// registers them, is not loaded. Run again after the page changes, since list rows add blocks.
function registerBlockStandIns({ actor }) {
  const { context } = actor.page;
  const { blockMetas } = context._internal.lowdefy._internal;
  collectBlockParents({ context }).blocks.forEach((block) => {
    const standIn = BLOCK_STAND_INS[block.type];
    if (!type.isUndefined(standIn)) {
      standIn.registerMethods?.({ actor, block, state: readStandInState({ actor, block }) });
      return;
    }
    if (blockMetas[block.type]?.category === 'list') {
      LIST_METHODS.forEach((method) => block.registerMethod(method, block[method]));
    }
    registerHeadlessMethods({ block, headlessMethods: blockMetas[block.type]?.headlessMethods });
    leaveMethodsToBrowser({ actor, block });
  });
}

export default registerBlockStandIns;
