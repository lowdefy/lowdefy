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

import checkHeadlessRails from './checkHeadlessRails.js';
import collectBlockParents from './collectBlockParents.js';
import POPUP_BLOCK_TYPES from './POPUP_BLOCK_TYPES.js';
import pressFiresShortcut from './pressFiresShortcut.js';

// The blocks a press of `key` in block `focused` can fire events on, as the browser runner's
// checkPressRails reads them from the page: the focused block and each block around it, innermost
// first, up to the Modal, Drawer or ConfirmModal whose portal holds it (the press reaches no block
// outside the portal), then each shown block with an event `shortcut` the press fires, as the
// client's createShortcutManager binds them.
function findPressedBlocks({ actor, focused, key }) {
  const { context } = actor.page;
  const { parents } = collectBlockParents({ context });
  const around = [];
  let current = focused;
  while (current) {
    around.push(current.blockId);
    if (POPUP_BLOCK_TYPES.has(current.type)) {
      break;
    }
    current = parents.get(current.id);
  }
  const fired = Object.entries(context._internal.RootSlots.map)
    .filter(([, block]) => block.visibleEval?.output !== false)
    .filter(([, block]) =>
      Object.values(block.Events?.events ?? {}).some((event) => {
        if (!event?.shortcut) return false;
        const bound = Array.isArray(event.shortcut) ? event.shortcut : [event.shortcut];
        // A headless press holds no modifier, so `$mod` never matches; any platform's will do.
        return bound.some((shortcut) =>
          pressFiresShortcut({ key, shortcut: String(shortcut), modifier: 'Control' })
        );
      })
    )
    .map(([blockId]) => blockId);
  return [...new Set([...around, ...fired])];
}

// On a data-set journey (rails: the run's createDataSetRails, else null), refuses a press of `key`
// in block `focused` before it acts when a block it can fire events on (findPressedBlocks) reaches
// a connection a data set cannot run against, with the first such block's message, as the browser
// runner's checkPressRails does. It refuses as much as the browser's does: a block around the
// focused one is checked whether or not it answers the key.
function checkHeadlessPressRails({ actor, focused, key, rails }) {
  if (rails === null) {
    return;
  }
  findPressedBlocks({ actor, focused, key }).forEach((blockId) =>
    checkHeadlessRails({ actor, blockId, rails, step: 'press' })
  );
}

export default checkHeadlessPressRails;
