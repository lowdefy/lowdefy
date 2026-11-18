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

import {
  clickTrigger,
  closeDropdown,
  leaveDropdown,
  openDropdown,
  refuseDisabled,
} from './dropdown.js';
import fireEvent from './fireEvent.js';
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

// The trigger is the block's own element, which a disabled dropdown leaves clickable: the click
// lands and nothing opens.
function clickBlock({ actor, block, state }) {
  if (block.eval.properties?.disabled === true) {
    return;
  }
  clickTrigger({
    actor,
    block,
    state,
    trigger: readTrigger(block),
    onClosed: onClosed({ block, state }),
  });
}

function open({ actor, block, state }) {
  refuseDisabled({ block });
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

export default { answersBlockClick, click, clickBlock, leave, open };
