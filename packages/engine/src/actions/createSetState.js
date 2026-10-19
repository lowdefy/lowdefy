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

function createSetState({ arrayIndices, context }) {
  return function setState(params) {
    const changes = Object.keys(params).map((key) => {
      const path = applyArrayIndices(arrayIndices, key);
      context._internal.State.set(path, params[key]);
      return `state:${path}`;
    });
    context._internal.RootSlots.reset();
    // SetState with nothing to set is used to refresh the page, so it stays a full pass.
    if (changes.length === 0) {
      context._internal.update();
      return;
    }
    context._internal.update({ changes });
  };
}

export default createSetState;
