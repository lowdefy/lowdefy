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
import isClickClaimed from '../isClickClaimed.js';
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
import findContentControl from './findContentControl.js';
import findOneControl from './findOneControl.js';
import followMenuLink from './followMenuLink.js';
import listMenuLinks from './listMenuLinks.js';
import readControlKey from './readControlKey.js';
import refuseMenuItem from './refuseMenuItem.js';

// What blocks-antd's DropdownMenu does (DropdownMenu.js): its links are menu items keyed by their
// id, in a dropdown that opens on hover unless `trigger` says click or contextMenu. A click on an
// item fires, in rc-menu's and antd's order:
// - onClick { key, keyPath, pageId, url };
// - onOpenChange { open: false }, as antd's Dropdown closes on a menu click;
// - onSelect { key, selectedKeys, pageId, url }, only when `selectable` is true (antd's Dropdown
//   makes its menu unselectable otherwise) and the key is not already selected: rc-menu fires
//   onDeselect for a selected key, which the block does not answer.
// Then the item's link is followed. The selected keys are properties.selectedKeys when set, else
// the menu's own (state.selectedKeys), which a `destroyOnClose` dropdown drops when it closes, as
// its menu unmounts.
//
// The block's `content` area is the dropdown's trigger: antd's Dropdown draws it as the element
// that opens the menu. A click on a block in it, or on the block itself, reaches the trigger after
// that block's own click.

function readTrigger(block) {
  return block.eval.properties?.trigger ?? 'hover';
}

function onClosed({ block, state }) {
  return () => {
    if (block.eval.properties?.destroyOnClose === true) {
      state.selectedKeys = [];
    }
  };
}

async function click({ actor, block, state, target }) {
  const control = readControlKey({ block, target });
  const properties = block.eval.properties ?? {};
  const item = findOneControl({
    block,
    control,
    controls: listMenuLinks({ links: properties.links, getKey: (link) => link.id }),
    noun: 'item',
  });
  if (refuseMenuItem({ actor, block, control, item })) {
    return;
  }
  refuseDisabled({ block });
  await openDropdown({ actor, block, state });
  const { link } = item;
  const selectable = properties.selectable === true;
  const selected = properties.selectedKeys ?? state.selectedKeys ?? [];
  const selects = selectable && !selected.includes(control);
  if (selectable) {
    state.selectedKeys = [control];
  }
  fireEvent({
    actor,
    block,
    name: 'onClick',
    event: { key: control, keyPath: [control], pageId: link.pageId, url: link.url },
  });
  closeDropdown({ actor, block, state, onClosed: onClosed({ block, state }) });
  if (selects) {
    fireEvent({
      actor,
      block,
      name: 'onSelect',
      event: { key: control, selectedKeys: [control], pageId: link.pageId, url: link.url },
    });
  }
  followMenuLink({ block, item });
}

function answersBlockClick() {
  return true;
}

// The block a plain click on the block lands on: the first control in its content
// (findContentControl), as the browser runner's click does, else the block itself (null).
function clickLandsOn({ actor, block }) {
  return findContentControl({ actor, block });
}

// The trigger is the block's own element, which a disabled dropdown leaves clickable: the click
// lands and nothing opens. claimed: a block in the content handled the click (isClickClaimed).
// Resolves once an open has fired its onOpenChange.
function clickOwnTrigger({ actor, block, state, claimed = false }) {
  if (block.eval.properties?.disabled === true) {
    return Promise.resolve();
  }
  return clickTrigger({
    actor,
    block,
    state,
    claimed,
    trigger: readTrigger(block),
    onClosed: onClosed({ block, state }),
  });
}

// A plain click on the block lands on the first control in its content (findContentControl), as
// the browser runner's does: that control fires its onClick, then the click reaches the trigger,
// which the control's onClick may have handled. A disabled control takes no click, so the
// browser's step fails. An input there changes its value on the click, which only a browser does.
async function clickBlock({ actor, block, state }) {
  const control = findContentControl({ actor, block });
  if (control === null) {
    await clickOwnTrigger({ actor, block, state });
    return;
  }
  const { blockMetas } = actor.page.context._internal.lowdefy._internal;
  if (blockMetas[control.type]?.category === 'input') {
    actor.browserOnly.push(
      `A click on ${describeBlock(block)} lands on input "${control.blockId}" (${control.type}) in its content, which a browser clicks: the step runs in a browser.`
    );
    return;
  }
  if (control.eval.properties?.disabled === true) {
    throw new HeadlessStepError(
      `A click on ${describeBlock(block)} lands on block "${control.blockId}", which is disabled.`,
      { actual: 'disabled', expected: `an enabled block "${control.blockId}"` }
    );
  }
  if (Object.hasOwn(control.Events.events, 'onClick')) {
    fireEvent({ actor, block: control, name: 'onClick' });
  }
  await clickOwnTrigger({
    actor,
    block,
    state,
    claimed: isClickClaimed({ actor, block: control, container: block }),
  });
}

// A plain click on a block in the content area, after that block's own click (pointerClick).
function clickContent({ actor, block, state, claimed }) {
  return clickOwnTrigger({ actor, block, state, claimed });
}

function open({ actor, block, state }) {
  refuseDisabled({ block });
  refuseOpenAgain({ block, state });
  openDropdown({ actor, block, state });
}

function leave({ actor, block, state, targetBlock }) {
  leaveDropdown({
    actor,
    block,
    state,
    targetBlock,
    trigger: readTrigger(block),
    onClosed: onClosed({ block, state }),
  });
}

export default {
  answersBlockClick,
  click,
  clickBlock,
  clickContent,
  clickLandsOn,
  leave,
  open,
};
