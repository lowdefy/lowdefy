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

import { type } from '@lowdefy/helpers';

import describeBlock from './describeBlock.js';
import fireEvent from './fireEvent.js';
import findOneControl from './findOneControl.js';
import followMenuLink from './followMenuLink.js';
import listMenuLinks from './listMenuLinks.js';
import readControlKey from './readControlKey.js';
import refuseMenuItem from './refuseMenuItem.js';

// What blocks-antd's Menu does (Menu.js): its links (properties.links, else the app menu
// properties.menuId names, else the first) are items keyed by their pageId, else their id. A
// click on an item fires onClick { key, keyPath }, then onSelect { key, keyPath } when the key is
// not selected; the Menu always passes selectedKeys (properties.selectedKeys, else the current
// page), so it keeps no selection of its own and the current page's item fires no onSelect. Then
// the item's link is followed. A horizontal Menu moves the items that do not fit into an overflow
// menu, which depends on the window's width, so its items are left to the browser.

function readLinks(block) {
  const { properties = {} } = block.eval;
  if (type.isArray(properties.links)) {
    return properties.links;
  }
  const { menus } = block.context._internal.lowdefy;
  if (!type.isArray(menus)) {
    return [];
  }
  const menuId = properties.menuId ?? 'default';
  const menu = menus.find((item) => item.menuId === menuId) ?? menus[0] ?? {};
  return menu.links ?? [];
}

async function click({ actor, block, target }) {
  const control = readControlKey({ block, target });
  const properties = block.eval.properties ?? {};
  if (properties.mode === 'horizontal') {
    actor.browserOnly.push(
      `${describeBlock(block)} is horizontal: an item can sit in its overflow menu, which depends on the window's width, so the click runs in a browser.`
    );
    return;
  }
  const item = findOneControl({
    block,
    control,
    controls: listMenuLinks({ links: readLinks(block), getKey: (link) => link.pageId ?? link.id }),
    noun: 'item',
  });
  if (refuseMenuItem({ actor, block, control, item })) {
    return;
  }
  const { lowdefy } = block.context._internal;
  const selected = properties.selectedKeys ?? [lowdefy.pageId];
  fireEvent({ actor, block, name: 'onClick', event: { key: control, keyPath: [control] } });
  if (!selected.includes(control)) {
    fireEvent({ actor, block, name: 'onSelect', event: { key: control, keyPath: [control] } });
  }
  followMenuLink({ block, item });
}

function answersBlockClick() {
  return true;
}

// A Menu's onClick is an item's event: a click on the block lands on whichever item is under it.
function clickBlock({ actor, block }) {
  actor.browserOnly.push(
    `A click on ${describeBlock(block)} lands on one of its items in a browser; name the item with control to run headless.`
  );
}

export default { answersBlockClick, click, clickBlock };
