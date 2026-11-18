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

import collectBlockParents from '../collectBlockParents.js';
import HeadlessStepError from '../HeadlessStepError.js';
import describeBlock from './describeBlock.js';
import fireEvent from './fireEvent.js';
import isInsideBlock from './isInsideBlock.js';

// The open state of a dropdown block (DropdownButton, DropdownMenu), which antd's Dropdown keeps
// and reports through onOpenChange { open }. state.open starts closed on every page.

function openDropdown({ actor, block, state }) {
  if (state.open === true) {
    return Promise.resolve();
  }
  state.open = true;
  return fireEvent({ actor, block, name: 'onOpenChange', event: { open: true } });
}

// onClosed runs once the dropdown has closed: a DropdownMenu with destroyOnClose drops the
// selection its menu kept.
function closeDropdown({ actor, block, state, onClosed }) {
  if (state.open !== true) {
    return;
  }
  state.open = false;
  fireEvent({ actor, block, name: 'onOpenChange', event: { open: false } });
  onClosed?.();
}

// A disabled dropdown has no trigger actions in antd: it never opens.
function refuseDisabled({ block }) {
  if (block.eval.properties?.disabled !== true) {
    return;
  }
  const description = describeBlock(block);
  throw new HeadlessStepError(`${description} is disabled: its dropdown does not open.`, {
    actual: 'disabled',
    expected: `an enabled ${description}`,
  });
}

// A person's next click, open or select elsewhere closes an open dropdown: a click outside it, or
// the mouse leaving a hover dropdown. A step on a block in a hover dropdown's own content keeps
// the mouse over its trigger, so the dropdown stays open.
function leaveDropdown({ actor, block, state, targetBlock, trigger, onClosed }) {
  if (trigger === 'hover' && targetBlock) {
    const { parents } = collectBlockParents({ context: actor.page.context });
    if (isInsideBlock({ block: targetBlock, container: block, parents })) {
      return;
    }
  }
  closeDropdown({ actor, block, state, onClosed });
}

// A plain click on a dropdown's trigger, as rc-trigger answers it: a click dropdown toggles, a
// hover dropdown opens as the mouse reaches it and stays open, and a contextMenu dropdown opens
// only on a right click, so a left click does nothing. Resolves once an open's onOpenChange has
// finished, since the mouse reaches a hover trigger before the click lands.
function clickTrigger({ actor, block, state, trigger, onClosed }) {
  if (trigger === 'click' && state.open === true) {
    closeDropdown({ actor, block, state, onClosed });
    return Promise.resolve();
  }
  if (trigger === 'click' || trigger === 'hover') {
    return openDropdown({ actor, block, state });
  }
  return Promise.resolve();
}

// An open step on a dropdown that is already open shows no popup the browser runner has not seen
// already: hovering a hover dropdown opens nothing more, and clicking a click dropdown closes it.
// The browser's step fails, so this one does, with its message.
function refuseOpenAgain({ block, state }) {
  if (state.open !== true) {
    return;
  }
  const description = `block "${block.blockId}"`;
  throw new HeadlessStepError(`Opening ${description} showed no dropdown or popup.`, {
    actual: `${describeBlock(block)} was open already`,
    expected: `a popup to open from ${description}`,
  });
}

export {
  clickTrigger,
  closeDropdown,
  leaveDropdown,
  openDropdown,
  refuseDisabled,
  refuseOpenAgain,
};
