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

import HeadlessStepError from '../HeadlessStepError.js';
import describeBlock from './describeBlock.js';

// A menu item a person cannot use here: one in a submenu is left to the browser (antd opens the
// submenu by hover or click first, which no stand-in models), and a disabled one refuses the click.
// Returns true when the step is the browser's.
function refuseMenuItem({ actor, block, control, item }) {
  const description = describeBlock(block);
  if (item.inSubmenu) {
    actor.browserOnly.push(
      `Item "${control}" of ${description} sits in a submenu, which opens in a browser.`
    );
    return true;
  }
  if (item.link.properties?.disabled === true) {
    throw new HeadlessStepError(`Item "${control}" of ${description} is disabled.`, {
      actual: 'disabled',
      expected: `an enabled item "${control}" in ${description}`,
    });
  }
  return false;
}

export default refuseMenuItem;
