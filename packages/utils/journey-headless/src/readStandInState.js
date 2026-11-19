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

// What a block's stand-in keeps on the shown page (a dropdown's open state, a confirm dialog's
// status), created empty the first time it is read. A new page starts with none, as the
// component's React state starts again.
function readStandInState({ actor, block }) {
  const { standIns } = actor.page;
  if (!standIns.has(block.id)) {
    standIns.set(block.id, { block, state: {} });
  }
  return standIns.get(block.id).state;
}

export default readStandInState;
