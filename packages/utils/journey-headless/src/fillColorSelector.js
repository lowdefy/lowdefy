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

// A fill of a ColorSelector, as the browser runner makes it (fillColorPicker): it clicks the
// picker's trigger before it types the hex colour, so the fill is a pointer click on the block too
// (pointerClick): another open dropdown closes as on a click outside, and a dropdown whose content
// holds the picker hears the click on its trigger. The Escape that closes the picker afterwards
// reaches no dropdown: the picker's hex input has the focus, and an open dropdown stays open. The
// fill's own checks have passed (checkFillTarget).
async function fillColorSelector({ actor, block, step }) {
  await pointerClick({ actor, block });
  await actor.stepRunner.run({ step });
  await actor.settle();
}

export default fillColorSelector;
