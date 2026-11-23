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

import BLOCK_STAND_INS from './BLOCK_STAND_INS.js';
import checkHeadlessPressRails from './checkHeadlessPressRails.js';
import checkHeadlessRails from './checkHeadlessRails.js';
import collectBlockParents from './collectBlockParents.js';
import ESCAPE_PASSING_INPUT_TYPES from './ESCAPE_PASSING_INPUT_TYPES.js';
import findShortcutBlocks from './findShortcutBlocks.js';
import POPUP_BLOCK_TYPES from './POPUP_BLOCK_TYPES.js';
import readStandInState from './readStandInState.js';
import describeBlock from './standIns/describeBlock.js';
import isInsideBlock from './standIns/isInsideBlock.js';
import standInMissing from './standInMissing.js';

const BROWSER = 'the step runs in a browser';

// The input that has the focus, or null: the one filled or selected in last, while no click, open
// or closing popup has moved the focus since (page.inputFocused, kept by runHeadlessStep).
function readFocusedInput({ actor }) {
  if (actor.page.inputFocused !== true) {
    return null;
  }
  return actor.page.context._internal.RootSlots.map[actor.stepRunner.lastInputBlockId()] ?? null;
}

// Whether the stand-in holds the block's dropdown, search or confirm open (state.open, or its own
// isOpen where something else can close it).
function isDropdownOpen({ block, state }) {
  const standIn = BLOCK_STAND_INS[block.type];
  return type.isFunction(standIn?.isOpen) ? standIn.isOpen({ block, state }) : state.open === true;
}

// The open Modals, Drawers and ConfirmModals, in the order they opened (page.openBlocks keeps
// it), and the blocks whose dropdown, search or confirm is open.
function readOpenOverlays({ actor, blocks }) {
  const byId = new Map(blocks.map((block) => [block.id, block]));
  const popups = [...actor.page.openBlocks].map((id) => byId.get(id)).filter(Boolean);
  const dropdowns = [];
  actor.page.standIns.forEach(({ block, state }) => {
    if (byId.has(block.id) && isDropdownOpen({ block, state })) {
      dropdowns.push(block);
    }
  });
  return { dropdowns, popups };
}

// What a browser's Escape closes: the overlay that opened last, as antd's portals keep them on one
// stack (the newest closes) and rc-dropdown, rc-select and ClickableHtml's overlay close their own.
// The stand-ins keep the open state but not when a dropdown opened beside a popup, so a dropdown
// counts as the newest only when it sits in the newest popup's content (it opened after the
// popup did, which showed it). Returns { block } to close, or { reason } it needs a browser.
function findEscapeTarget({ actor, blocks, parents }) {
  const { dropdowns, popups } = readOpenOverlays({ actor, blocks });
  const top = popups.at(-1);
  if (dropdowns.length > 1) {
    const names = dropdowns.map((block) => `"${block.blockId}"`).join(', ');
    return {
      reason: `Blocks ${names} are all open, and which one a browser's Escape closes depends on the order they opened: ${BROWSER}.`,
    };
  }
  if (dropdowns.length === 1) {
    const [dropdown] = dropdowns;
    if (type.isUndefined(top) || isInsideBlock({ block: dropdown, container: top, parents })) {
      return { block: dropdown };
    }
    return {
      reason: `${describeBlock(dropdown)} is open beside ${describeBlock(top)}, and which one a browser's Escape closes depends on the order they opened: ${BROWSER}.`,
    };
  }
  if (type.isUndefined(top)) {
    return {
      reason: `Nothing is open for Escape to close, so in a browser it reaches the page: ${BROWSER}.`,
    };
  }
  return { block: top };
}

// Why Escape needs a browser before it looks at what is open, or undefined: a shortcut binds it,
// a Modal or Drawer renders while closed (forceRender keeps it on the browser's Escape stack), or
// the focus is in an input that handles Escape itself.
function findEarlyReason({ actor, blocks, focused }) {
  const [shortcut] = findShortcutBlocks({ actor, key: 'Escape' });
  if (!type.isUndefined(shortcut)) {
    return `Block "${shortcut}" binds Escape as an event shortcut, which a headless press does not fire: ${BROWSER}.`;
  }
  const forced = blocks.find(
    (block) => POPUP_BLOCK_TYPES.has(block.type) && block.eval.properties?.forceRender === true
  );
  if (!type.isUndefined(forced)) {
    return `${describeBlock(forced)} renders while closed (forceRender), which puts it on a browser's Escape stack from the start: ${BROWSER}.`;
  }
  if (focused === null) {
    return undefined;
  }
  if (!ESCAPE_PASSING_INPUT_TYPES.has(focused.type)) {
    return `The focus is in ${describeBlock(focused)}, whose own Escape handling a headless run does not model: ${BROWSER}.`;
  }
  if (Object.hasOwn(focused.Events.events, 'onEscape')) {
    return `The focus is in ${describeBlock(focused)}, which fires its own onEscape: ${BROWSER}.`;
  }
  return undefined;
}

// A press of Escape headless (runHeadlessStep). A searching selector with the focus and its
// dropdown open closes it; otherwise Escape closes the overlay that opened last (findEscapeTarget)
// through its stand-in's escape part: a Modal fires onCancel, a Drawer onClose, a dropdown
// onOpenChange { open: false }, a ClickableHtml confirm drops its event. Anything a headless run
// does not model leaves the step to the browser, naming why (findEarlyReason, findEscapeTarget, a
// ConfirmModal's dialog). On a data-set journey the press is checked against the rails first, as
// the browser runner checks it: the focused input and the blocks around it, and the overlay it
// closes, whose portal or wrapper holds the focus in a browser. Closing a popup hands the focus
// back to where it was before the popup opened, so no input has it after.
async function pressEscape({ actor, rails }) {
  const { blocks, parents } = collectBlockParents({ context: actor.page.context });
  const focused = readFocusedInput({ actor });
  const early = findEarlyReason({ actor, blocks, focused });
  if (!type.isUndefined(early)) {
    actor.browserOnly.push(early);
    return;
  }
  const focusedOpen =
    focused !== null &&
    isDropdownOpen({ block: focused, state: readStandInState({ actor, block: focused }) });
  const target = focusedOpen ? { block: focused } : findEscapeTarget({ actor, blocks, parents });
  if (!type.isUndefined(target.reason)) {
    actor.browserOnly.push(target.reason);
    return;
  }
  const { block } = target;
  const standIn = BLOCK_STAND_INS[block.type];
  if (!type.isFunction(standIn?.escape)) {
    actor.browserOnly.push(standInMissing({ block, what: 'press "Escape"' }));
    return;
  }
  if (focused !== null) {
    checkHeadlessPressRails({ actor, focused, key: 'Escape', rails });
  }
  checkHeadlessRails({ actor, blockId: block.blockId, rails, step: 'press' });
  await standIn.escape({ actor, block, state: readStandInState({ actor, block }) });
  await actor.settle();
  if (POPUP_BLOCK_TYPES.has(block.type) && !actor.page.openBlocks.has(block.id)) {
    actor.page.inputFocused = false;
  }
}

export default pressEscape;
