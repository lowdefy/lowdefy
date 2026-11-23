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

// Registers the methods a block's meta declares for a headless run, for a block whose type has
// no stand-in (BLOCK_STAND_INS), such as a block from the app's own plugin. headlessMethods is
// { [method]: event }: the method fires that one of the block's own events, with the method's
// first argument as the event, and returns the event's result for CallMethod to wait on, as a
// component's `methods.registerMethod(method, (event) => methods.triggerEvent({ name, event }))`
// does in the browser. A declaration that names no event fails, naming the block type and the
// method, rather than leaving the method to the browser unseen.
function registerHeadlessMethods({ block, headlessMethods }) {
  if (type.isNone(headlessMethods)) {
    return;
  }
  if (!type.isObject(headlessMethods)) {
    throw new Error(
      `Block type ${block.type} declares headlessMethods as ${JSON.stringify(headlessMethods)}: it should be an object of { [method]: the name of the event it fires }.`
    );
  }
  Object.entries(headlessMethods).forEach(([method, name]) => {
    if (!type.isString(name) || name === '') {
      throw new Error(
        `Block type ${block.type} declares headlessMethods.${method} as ${JSON.stringify(name)}: it should be the name of the block event the method fires.`
      );
    }
    block.registerMethod(method, (event) => block.triggerEvent({ name, event }));
  });
}

export default registerHeadlessMethods;
