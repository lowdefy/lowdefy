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
import {
  clickTrigger,
  closeDropdown,
  leaveDropdown,
  openDropdown,
  refuseDisabled,
  refuseOpenAgain,
} from './dropdown.js';
import fireEvent from './fireEvent.js';
import findOneControl from './findOneControl.js';
import readControlKey from './readControlKey.js';

// What blocks-antd's DropdownButton does (DropdownButton.js): each item but a divider is keyed by
// its eventName, else item-<index>; a click on it fires the event its key names, with no payload,
// then antd's Dropdown closes the menu (onOpenChange { open: false }). The dropdown opens on click
// unless `trigger: hover`. A split button's main button fires onClick, which is a plain block
// click; a button that is not split has no onClick, and a click on it opens its dropdown.

function readTrigger(block) {
  return block.eval.properties?.trigger ?? 'click';
}

function readItems(block) {
  return (block.eval.properties?.items ?? []).flatMap((item, index) =>
    item.type === 'divider'
      ? []
      : [{ key: item.eventName ?? `item-${index}`, disabled: item.disabled === true }]
  );
}

async function click({ actor, block, state, target }) {
  const control = readControlKey({ block, target });
  const item = findOneControl({ block, control, controls: readItems(block), noun: 'item' });
  refuseDisabled({ block });
  if (item.disabled) {
    const description = describeBlock(block);
    throw new HeadlessStepError(`Item "${control}" of ${description} is disabled.`, {
      actual: 'disabled',
      expected: `an enabled item "${control}" in ${description}`,
    });
  }
  await openDropdown({ actor, block, state });
  fireEvent({ actor, block, name: control });
  closeDropdown({ actor, block, state });
}

function answersBlockClick({ block }) {
  return block.eval.properties?.split !== true;
}

// The button is disabled with the dropdown, and a browser cannot click a disabled button.
function clickBlock({ actor, block, state }) {
  refuseDisabled({ block });
  clickTrigger({ actor, block, state, trigger: readTrigger(block) });
}

function open({ actor, block, state }) {
  refuseDisabled({ block });
  refuseOpenAgain({ block, state });
  openDropdown({ actor, block, state });
}

function leave({ actor, block, state, targetBlock }) {
  leaveDropdown({ actor, block, state, targetBlock, trigger: readTrigger(block) });
}

export default { answersBlockClick, click, clickBlock, leave, open };
