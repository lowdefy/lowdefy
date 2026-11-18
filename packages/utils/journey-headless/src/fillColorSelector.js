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

import pointerClick from './pointerClick.js';
import pressEscape from './pressEscape.js';

// A fill of a ColorSelector, as the browser runner makes it (fillColorPicker): it clicks the
// picker's trigger, types the hex colour, then presses Escape to close the picker. The click is
// the pointer's (pointerClick) and the Escape closes every open dropdown on the page as well
// (pressEscape). The fill's own checks have passed (checkFillTarget).
async function fillColorSelector({ actor, block, step }) {
  await pointerClick({ actor, block });
  await actor.stepRunner.run({ step });
  pressEscape({ actor });
  await actor.settle();
}

export default fillColorSelector;
