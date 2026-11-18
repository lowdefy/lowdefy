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

import { journeyTargetSelectors, type } from '@lowdefy/helpers';

import { armAuthActionRecorder } from './checkAuthActionsRan.js';
import { checkBlockRails } from './checkStepRails.js';
import pressFiresShortcut from './pressFiresShortcut.js';

const { blockWrapperPrefix, controlAttributes, portalClass } = journeyTargetSelectors;
const PORTAL_PREFIX = portalClass('');

// Runs in the page. What a press can reach from the focused element: the id of every block
// wrapper around it (an input's, then each container's), the block of the nearest control mark
// around it (a modal's OK button, drawn in a portal outside every wrapper) and the portal classes
// around it (a Modal or Drawer whose dialog has focus, which Escape closes). Also the shown
// page's id, the ids of the blocks its engine holds and every shortcut they bind, as client
// createShortcutManager reads them (each event's `shortcut`, one or a list) from the blocks it
// does not skip (a block whose own `visible` is false).
function readPressBlocks({ wrapperPrefix, markAttribute, portalPrefix }) {
  const lowdefy = window.lowdefy;
  const around = { wrappers: [], control: null, portals: [] };
  for (let node = document.activeElement; node; node = node.parentElement) {
    if (node.id?.startsWith(wrapperPrefix)) {
      around.wrappers.push(node.id.slice(wrapperPrefix.length));
    }
    const marked = node.getAttribute?.(markAttribute);
    if (around.control === null && marked) around.control = marked;
    [...(node.classList ?? [])]
      .filter((name) => name.startsWith(portalPrefix))
      .forEach((name) => around.portals.push(name));
  }
  if (!lowdefy?.pageId || lowdefy._devNavigating === true) {
    return { pageId: null, around, blockIds: [], shortcuts: [] };
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
  return { pageId: lowdefy.pageId, around, blockIds: Object.keys(blocks), shortcuts };
}

// The blocks a press of `key` can fire events on. Around the focused element: each block whose
// wrapper holds it (a key press there can fire the input's onPressEnter, onChange or onBlur, and
// Enter on a button its onClick, which a container's onClick hears too), the block a control mark
// around it names, and the block whose portal holds it (Escape fires a Modal's onCancel and
// onClose, a Drawer's onClose). A portal class is matched against the engine's block ids, since
// it turns a block id's dots into underscores. Then each shown block with a shortcut the chord
// fires (its onClick, say, through `shortcut: mod+s`).
function findPressedBlocks({ pressed, key, modifier }) {
  const { around } = pressed;
  const portalBlocks = pressed.blockIds.filter((blockId) =>
    around.portals.includes(portalClass(blockId))
  );
  const focused = [...around.wrappers, around.control, ...portalBlocks].filter(
    (blockId) => !type.isNone(blockId)
  );
  const fired = pressed.shortcuts
    .filter(({ shortcut }) => pressFiresShortcut({ key, shortcut, modifier }))
    .map(({ blockId }) => blockId);
  // The block a refusal or the auth rail names: the innermost one the focused element sits in,
  // or the one block a shortcut fires, when that is the only block the press acts on.
  const acted = new Set([...focused.slice(0, 1), ...fired]);
  return {
    blockIds: [...new Set([...focused, ...fired])],
    named: acted.size === 1 ? [...acted][0] : null,
  };
}

// On a data-set run (journey.dataSetRails), refuses a press of `key` (the chord the runner
// presses, `Mod` resolved to `modifier`) before it is pressed when a block it can fire events on
// reaches a connection the session cannot run, and starts recording the auth-engine actions the
// press runs (checkAuthActionsRan fails the step if one does). Returns the block the press acts
// on: the innermost block around the focused element, or the one block a shortcut fires, when
// that is the only block it acts on; else null. Journeys without a data set press anything.
async function checkPressRails({ journey, page, key, modifier }) {
  if (type.isUndefined(journey.dataSetRails)) {
    return null;
  }
  await armAuthActionRecorder({ journey, page });
  const pressed = await page.evaluate(readPressBlocks, {
    wrapperPrefix: blockWrapperPrefix,
    markAttribute: controlAttributes.blockId,
    portalPrefix: PORTAL_PREFIX,
  });
  const { blockIds, named } = findPressedBlocks({ pressed, key, modifier });
  if (!type.isNone(pressed.pageId)) {
    blockIds.forEach((blockId) =>
      checkBlockRails({ journey, pageId: pressed.pageId, blockId, step: 'press' })
    );
  }
  return named;
}

export default checkPressRails;
