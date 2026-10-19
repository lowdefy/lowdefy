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

// The composed slot for after and synthetic points - engine hooks first,
// then the user hooks in array order, sequentially. Return values are
// ignored; a thrown error propagates as an operational error on the
// underlying operation.
function composeAfterSlot({ hooks }) {
  return async function afterSlot(data, ctx) {
    for (const hook of hooks) {
      await hook(data, ctx);
    }
  };
}

export default composeAfterSlot;
