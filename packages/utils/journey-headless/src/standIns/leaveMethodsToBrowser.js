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

import standInMissing from '../standInMissing.js';

// The blocks already answering through leaveMethodsToBrowser, so a later pass leaves them be.
const answered = new WeakSet();

// Answers a CallMethod on a block whose type has no headless stand-in (BLOCK_STAND_INS), such as
// a block from the app's own plugin. Its component registers its methods in the browser, and a
// headless page loads no component, so which methods the block has is unknown here. A method the
// block has not registered (a list block's item methods are registered) marks the journey
// browser-only at that point, naming the block, its type and the method, rather than failing on
// a method the browser would have. engine's CallMethod is the only reader of block.methods.
function leaveMethodsToBrowser({ actor, block }) {
  if (answered.has(block)) {
    return;
  }
  answered.add(block);
  block.methods = new Proxy(block.methods, {
    get(target, method, receiver) {
      if (typeof method !== 'string' || Object.hasOwn(target, method)) {
        return Reflect.get(target, method, receiver);
      }
      return () => {
        actor.browserOnly.push(standInMissing({ block, what: `CallMethod ${method}` }));
      };
    },
  });
}

export default leaveMethodsToBrowser;
