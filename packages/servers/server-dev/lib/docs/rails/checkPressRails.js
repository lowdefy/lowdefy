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

import { armAuthActionRecorder } from './checkAuthActionsRan.js';
import { checkBlockRails } from './checkStepRails.js';
import pressFiresShortcut from './pressFiresShortcut.js';

// Runs in the page: the shown page's id, the block around the focused element (null when focus
// is on the page body or outside every #bl- wrapper) and every shortcut the page's blocks bind,
// as client createShortcutManager reads them (each event's `shortcut`, one or a list), from the
// blocks it does not skip (a block whose own `visible` is false).
function readPressBlocks() {
  const lowdefy = window.lowdefy;
  const focused = document.activeElement?.closest?.('[id^="bl-"]')?.id.slice(3) ?? null;
  if (!lowdefy?.pageId || lowdefy._devNavigating === true) {
    return { pageId: null, focused, shortcuts: [] };
  }
  const shownKey = lowdefy.pageInstances?.[lowdefy.pageId]?.at(-1);
  const blocks = lowdefy.contexts?.[shownKey]?._internal?.RootSlots?.map ?? {};
  const shortcuts = [];
  Object.entries(blocks).forEach(([blockId, block]) => {
    if (block?.visibleEval?.output === false) return;
    Object.values(block?.Events?.events ?? {}).forEach((event) => {
      if (!event?.shortcut) return;
      const bound = Array.isArray(event.shortcut) ? event.shortcut : [event.shortcut];
      bound.forEach((shortcut) => shortcuts.push({ blockId, shortcut: String(shortcut) }));
    });
  });
  return { pageId: lowdefy.pageId, focused, shortcuts };
}

// The blocks a press of `key` can fire events on: the block that has focus (a key press there
// can fire its onPressEnter, onChange, onBlur or a form's submit) and each shown block with a
// shortcut the chord fires (its onClick, say, through `shortcut: mod+s`).
function findPressedBlocks({ pressed, key, modifier }) {
  const blockIds = new Set();
  if (!type.isNone(pressed.focused)) blockIds.add(pressed.focused);
  pressed.shortcuts
    .filter(({ shortcut }) => pressFiresShortcut({ key, shortcut, modifier }))
    .forEach(({ blockId }) => blockIds.add(blockId));
  return [...blockIds];
}

// On a data-set run (journey.dataSetRails), refuses a press of `key` (the chord the runner
// presses, `Mod` resolved to `modifier`) before it is pressed when a block it can fire events on
// reaches a connection the session cannot run, and starts recording the auth-engine actions the
// press runs (checkAuthActionsRan fails the step if one does). Returns the block's id when the
// press reaches one block, else null. Journeys without a data set press anything.
async function checkPressRails({ journey, page, key, modifier }) {
  if (type.isUndefined(journey.dataSetRails)) {
    return null;
  }
  await armAuthActionRecorder({ journey, page });
  const pressed = await page.evaluate(readPressBlocks);
  const blockIds = findPressedBlocks({ pressed, key, modifier });
  if (!type.isNone(pressed.pageId)) {
    blockIds.forEach((blockId) =>
      checkBlockRails({ journey, pageId: pressed.pageId, blockId, step: 'press' })
    );
  }
  return blockIds.length === 1 ? blockIds[0] : null;
}

export default checkPressRails;
