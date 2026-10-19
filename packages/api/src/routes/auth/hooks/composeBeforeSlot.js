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

// BetterAuth exposes one callback per database point, so each point resolves
// to a single composed slot - engine hooks first, then the user hooks in
// array order. The slot threads the record: what one hook returns is passed
// to the next, and the final record is handed back to BetterAuth as
// { data }. The first hook
// to veto short-circuits - a returned false aborts the write, and a thrown
// error propagates; there is no cross-hook transaction, so external
// side-effects of earlier hooks are not rolled back.
function composeBeforeSlot({ hooks }) {
  return async function beforeSlot(data, ctx) {
    let record = data;
    for (const hook of hooks) {
      const result = await hook(record, ctx);
      if (result === false) {
        return false;
      }
      if (type.isObject(result) && 'data' in result) {
        record = result.data;
      }
    }
    return { data: record };
  };
}

export default composeBeforeSlot;
