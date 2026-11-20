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

import describeBlock from './describeBlock.js';

// Registers block methods the component has and its stand-in does not model, each by what it does
// (`methods`: { [method]: what }). A CallMethod with one leaves the journey to the browser at
// that step, naming the method, rather than failing on a method the page does not have.
function registerBrowserOnlyMethods({ actor, block, methods }) {
  Object.entries(methods).forEach(([method, what]) => {
    block.registerMethod(method, () => {
      actor.browserOnly.push(
        `CallMethod ${method} on ${describeBlock(block)} ${what}, which the headless stand-in does not model: the step runs in a browser.`
      );
    });
  });
}

export default registerBrowserOnlyMethods;
