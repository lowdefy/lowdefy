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

import checkHeadlessMethods from '@lowdefy/block-utils/checkHeadlessMethods.js';
import { type } from '@lowdefy/helpers';

import REDRAWN_BLOCKS from './REDRAWN_BLOCKS.js';

// Registers the methods a block's meta declares for a headless run, for a block whose type has
// no stand-in (BLOCK_STAND_INS), such as a block from the app's own plugin. headlessMethods is
// { [method]: event or null }. A method with an event fires that one of the block's own events,
// with the method's first argument as the event, and returns the event's result for CallMethod to
// wait on, as a component's `methods.registerMethod(method, (event) => methods.triggerEvent({
// name, event }))` does in the browser. A method declared null changes only what the block draws,
// so it is a no-op: CallMethod resolves with undefined at once, and the block is recorded in
// REDRAWN_BLOCKS, since what it draws now is not what its properties say (readTextModel). A declaration that is neither
// fails, naming the block type and the method (checkHeadlessMethods), rather than leaving the
// method to the browser unseen.
function registerHeadlessMethods({ block, headlessMethods }) {
  checkHeadlessMethods({ blockType: block.type, headlessMethods });
  if (type.isNone(headlessMethods)) {
    return;
  }
  Object.entries(headlessMethods).forEach(([method, name]) => {
    if (name === null) {
      block.registerMethod(method, () => {
        REDRAWN_BLOCKS.set(block, method);
        return undefined;
      });
      return;
    }
    block.registerMethod(method, (event) => block.triggerEvent({ name, event }));
  });
}

export default registerHeadlessMethods;
