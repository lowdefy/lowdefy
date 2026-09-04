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

import isOperatorValue from './isOperatorValue.js';
import { AREA_KEYS, ITEM_KEYS } from './layoutKeys.js';

// Checks run after buildPages, so every container's children live under
// block.slots[slotKey].blocks and every deprecated layout spelling has already
// been renamed to its current name.
function collectFromBlock({ block, pageId, sites }) {
  const layout = block.layout;
  if (!type.isNone(layout)) {
    if (isOperatorValue(layout)) {
      sites.push({
        pageId,
        blockId: block.blockId,
        scope: 'layout',
        configKey: layout['~k'] ?? block['~k'],
        keys: [],
        itemKeys: [],
        areaKeys: [],
        dynamicKeys: [],
        dynamicLayout: true,
      });
    } else if (type.isObject(layout)) {
      const present = Object.keys(layout).filter((key) => !key.startsWith('~'));
      if (present.length > 0) {
        // A key whose value is an operator has no static rewrite, so it is
        // named as dynamic and kept out of the wrapper advice.
        const dynamicKeys = present.filter((key) => isOperatorValue(layout[key]));
        const staticKeys = present.filter((key) => !dynamicKeys.includes(key));
        sites.push({
          pageId,
          blockId: block.blockId,
          scope: 'layout',
          configKey: layout['~k'] ?? block['~k'],
          keys: present,
          itemKeys: staticKeys.filter((key) => ITEM_KEYS.includes(key)),
          areaKeys: staticKeys.filter((key) => AREA_KEYS.includes(key)),
          dynamicKeys,
          dynamicLayout: false,
          columnDirection: layout.direction === 'column' || layout.direction === 'column-reverse',
        });
      }
    }
  }

  for (const [slotKey, slot] of Object.entries(block.slots ?? {})) {
    if (!type.isObject(slot)) continue;
    const areaKeys = AREA_KEYS.filter((key) => !type.isNone(slot[key]));
    if (areaKeys.length > 0) {
      const dynamicKeys = areaKeys.filter((key) => isOperatorValue(slot[key]));
      sites.push({
        pageId,
        blockId: block.blockId,
        scope: `slots.${slotKey}`,
        configKey: slot['~k'] ?? block['~k'],
        keys: areaKeys,
        itemKeys: [],
        areaKeys: areaKeys.filter((key) => !dynamicKeys.includes(key)),
        dynamicKeys,
        dynamicLayout: false,
        columnDirection: slot.direction === 'column' || slot.direction === 'column-reverse',
      });
    }
    for (const child of slot.blocks ?? []) {
      collectFromBlock({ block: child, pageId, sites });
    }
  }
}

function collectLayoutSites({ components }) {
  const sites = [];
  for (const page of components.pages ?? []) {
    collectFromBlock({ block: page, pageId: page.pageId ?? page.blockId, sites });
  }
  return sites;
}

export default collectLayoutSites;
