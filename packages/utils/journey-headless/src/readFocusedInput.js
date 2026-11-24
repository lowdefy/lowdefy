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

// The input that has the focus, or null: the one filled or selected in last, while no click, open
// or popup opening or closing has moved the focus off it since (page.inputFocused, kept by
// runHeadlessStep's noteFocus and movePopupFocus), or the one a closing popup handed it back to.
function readFocusedInput({ actor }) {
  if (!actor.page.inputFocused) {
    return null;
  }
  return actor.page.context._internal.RootSlots.map[actor.stepRunner.lastInputBlockId()] ?? null;
}

export default readFocusedInput;
