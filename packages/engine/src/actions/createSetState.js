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

import { applyArrayIndices } from '@lowdefy/helpers';
import { flashBlock } from '@lowdefy/block-utils';

function createSetState({ arrayIndices, context }) {
  return function setState(params, options) {
    const keys = Object.keys(params);
    keys.forEach((key) => {
      context._internal.State.set(applyArrayIndices(arrayIndices, key), params[key]);
    });
    context._internal.RootSlots.reset();
    context._internal.update();
    if (options && options.flash) {
      keys.forEach((key) => {
        flashBlock(applyArrayIndices(arrayIndices, key));
      });
    }
  };
}

export default createSetState;
