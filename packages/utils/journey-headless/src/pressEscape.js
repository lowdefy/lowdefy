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
import findOpenTour from './findOpenTour.js';
import findShortcutBlocks from './findShortcutBlocks.js';
import POPUP_BLOCK_TYPES from './POPUP_BLOCK_TYPES.js';
import readFocusedInput from './readFocusedInput.js';
import readShownBlock from './readShownBlock.js';
import readStandInState from './readStandInState.js';
import describeBlock from './standIns/describeBlock.js';
import isInsideBlock from './standIns/isInsideBlock.js';
import standInMissing from './standInMissing.js';

const BROWSER = 'the step runs in a browser';

// Whether the stand-in holds the block's dropdown, search or confirm open (state.open, or its own
// isOpen where something else can close it).
function isDropdownOpen({ block, state }) {
  const standIn = BLOCK_STAND_INS[block.type];
  return type.isFunction(standIn?.isOpen) ? standIn.isOpen({ block, state }) : state.open === true;
}

// The open Modals, Drawers and ConfirmModals, in the order they opened (page.openBlocks keeps
// it), and the blocks whose dropdown, search or confirm is open, in page order.
function readOpenOverlays({ actor, blocks }) {
  const byId = new Map(blocks.map((block) => [block.id, block]));
  // A popup in a list row the page has since removed stays in openBlocks; it is on no stack.
  const popups = [...actor.page.openBlocks].map((id) => byId.get(id)).filter(Boolean);
  const dropdowns = blocks.filter((block) => {
    const kept = actor.page.standIns.get(block.id);
    return !type.isUndefined(kept) && isDropdownOpen({ block, state: kept.state });
  });
  return { dropdowns, popups };
}

// What a browser's Escape closes: the overlay that opened last, as antd's portals keep them on one
// stack and close the newest. rc-dropdown closes every open dropdown on Escape, wherever it is on
// the stack, so with more than one open the browser closes more than the newest. The stand-ins
// keep no order between a dropdown and a popup, so a dropdown (a searching selector's search
// included) counts as the newest only in the newest popup's content: it opened after the popup
// did, which showed it. Returns { block } to close, or { reason } it needs a browser.
function findEscapeTarget({ actor, blocks, parents }) {
  const { dropdowns, popups } = readOpenOverlays({ actor, blocks });
  const top = popups.at(-1);
  const pointerPopup = findPointerPopup({ actor, parents, top });
  if (!type.isUndefined(pointerPopup)) {
    return {
      reason: `The pointer rests on ${describeBlock(pointerPopup)}, whose tooltip or popover a browser shows on top of what Escape would close: ${BROWSER}.`,
    };
  }
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

// Block types that draw a Menu of the app's `menus` (its menuId's, else the first) when they have
// no `links` of their own, as blocks-antd's Menu does (getDefaultMenu).
const APP_MENU_TYPES = new Set([
  'Menu',
  'MobileMenu',
  'PageHeaderMenu',
  'PageSiderMenu',
  'PageSidebarLayout',
]);

// Block types that bind their items' `shortcut`s (blocks-antd's useItemShortcuts: tabs, menu
// links, dropdown items) on a document listener that a key pressed in an input skips.
const ITEM_SHORTCUT_TYPES = new Set(['DropdownButton', 'DropdownMenu', 'Tabs', ...APP_MENU_TYPES]);
const SHORTCUT_MODIFIERS = ['alt', 'ctrl', 'mod', 'shift'];

// Whether useItemShortcuts' matchesShortcut fires `shortcut` on a press of Escape alone: its last
// part names the key, and a modifier it asks for is not held.
function itemShortcutIsEscape(shortcut) {
  const parts = shortcut.toLowerCase().split('+');
  return parts.at(-1) === 'escape' && !SHORTCUT_MODIFIERS.some((part) => parts.includes(part));
}

// Whether a `shortcut` anywhere in the block's properties (a tab's, a link's, an item's) is
// Escape.
function bindsItemEscape(value) {
  if (type.isArray(value)) {
    return value.some(bindsItemEscape);
  }
  if (!type.isObject(value)) {
    return false;
  }
  return Object.entries(value).some(([key, inner]) =>
    key === 'shortcut' && type.isString(inner)
      ? itemShortcutIsEscape(inner)
      : bindsItemEscape(inner)
  );
}

// Whether the block binds Escape as an item shortcut: one in its properties, or, for a block that
// draws the app's menus, one in any of them (over-read on the safe side).
function bindsBlockItemEscape({ actor, block }) {
  const properties = block.eval.properties ?? {};
  if (bindsItemEscape(properties)) {
    return true;
  }
  return (
    APP_MENU_TYPES.has(block.type) &&
    !type.isArray(properties.links) &&
    bindsItemEscape(actor.page.context._internal.lowdefy.menus ?? [])
  );
}

// Block types whose component can show a tooltip or popover under the pointer on its own: a grid's
// buttons cells give an icon-only button its title as a tooltip.
const POINTER_POPUP_TYPES = new Set([
  'AgGridAlpine',
  'AgGridBalham',
  'AgGridLowdefy',
  'AgGridMaterial',
  'Popover',
  'Table',
  'TableLight',
  'Tooltip',
]);

// Whether the block can show a tooltip or popover where the pointer rests: a Button with a
// tooltip (its own, or its title when the title is hidden, as Button.js works it out), html with
// a data-tooltip or data-popover element, or a type in POINTER_POPUP_TYPES.
function drawsPointerPopup(block) {
  const properties = block.eval.properties ?? {};
  if (POINTER_POPUP_TYPES.has(block.type)) {
    return true;
  }
  if (block.type === 'Button') {
    const titleHidden =
      properties.hideTitle === true ||
      (properties.shape === 'circle' && type.isNone(properties.title));
    return type.isString(properties.tooltip) || (titleHidden && !type.isNone(properties.title));
  }
  if (block.type === 'Html' || block.type === 'ClickableHtml') {
    const html = String(properties.html ?? '');
    return html.includes('data-tooltip') || html.includes('data-popover');
  }
  return false;
}

// The block the pointer rests on, or one holding it, that can show a popup there, or undefined. A
// tooltip or popover is a trigger popup on antd's Escape stack, opened after what Escape would
// close, so it takes the Escape (its show delay makes the browser's answer a race). A block behind
// the newest popup's mask has lost the pointer, so it shows none.
function findPointerPopup({ actor, parents, top }) {
  let current = readShownBlock({ actor, blockId: actor.page.pointerBlockId });
  if (
    current !== null &&
    !type.isUndefined(top) &&
    top.eval.properties?.mask !== false &&
    !isInsideBlock({ block: current, container: top, parents })
  ) {
    return undefined;
  }
  while (current) {
    if (drawsPointerPopup(current)) {
      return current;
    }
    current = parents.get(current.id);
  }
  return undefined;
}

// Why Escape needs a browser before it looks at what is open, or undefined: an event shortcut
// binds it, an item shortcut does while no input has the focus, a Tour is open (findOpenTour), a
// Modal or Drawer renders while closed (forceRender keeps it on the browser's Escape stack), or
// the focus is in an input that handles Escape itself.
function findEarlyReason({ actor, blocks, focused }) {
  const [shortcut] = findShortcutBlocks({ actor, key: 'Escape' });
  if (!type.isUndefined(shortcut)) {
    return `Block "${shortcut}" binds Escape as an event shortcut, which a headless press does not fire: ${BROWSER}.`;
  }
  const items = blocks.find(
    (block) =>
      ITEM_SHORTCUT_TYPES.has(block.type) &&
      block.visibleEval?.output !== false &&
      bindsBlockItemEscape({ actor, block })
  );
  if (focused === null && !type.isUndefined(items)) {
    return `${describeBlock(items)} binds Escape as an item shortcut, which a headless press does not fire: ${BROWSER}.`;
  }
  const tour = findOpenTour({ blocks });
  if (!type.isUndefined(tour)) {
    return `${describeBlock(tour)} is open, and a browser's Escape closes it whichever overlay is on top, or keeps it on top of what Escape would close: ${BROWSER}.`;
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

// The block a click left the focus on, when no input has it, for the rails: the block the pointer
// rests on, when it is the overlay Escape closes or inside it (a button clicked in a Modal, a
// dropdown's trigger). A browser checks it and every block around it up to the popup. A
// ClickableHtml confirm takes the focus into its own popup, which only the block's control mark
// names, so its block alone is checked.
function readPointerFocus({ actor, block, parents }) {
  const pointer = readShownBlock({ actor, blockId: actor.page.pointerBlockId });
  if (pointer === null || block.type === 'ClickableHtml') {
    return null;
  }
  if (pointer.id === block.id || isInsideBlock({ block: pointer, container: block, parents })) {
    return pointer;
  }
  return null;
}

// A press of Escape headless (runHeadlessStep). It closes the overlay that opened last
// (findEscapeTarget) through its stand-in's escape part: a searching selector closes its search,
// a Modal fires onCancel, a Drawer onClose, a dropdown onOpenChange { open: false }, a
// ClickableHtml confirm drops its event. Anything a headless run does not model leaves the step to
// the browser, naming why (findEarlyReason, findEscapeTarget, a ConfirmModal's dialog). On a
// data-set journey the press is checked against the rails first, as the browser runner checks it:
// the block with the focus (the focused input, else the block a click left it on in the overlay,
// readPointerFocus) and the blocks around it, and the overlay it closes, whose portal or wrapper
// holds the focus in a browser. A popup the press closes moves the focus as it closes
// (movePopupFocus, through setOpen).
async function pressEscape({ actor, rails }) {
  const { blocks, parents } = collectBlockParents({ context: actor.page.context });
  const focused = readFocusedInput({ actor });
  const early = findEarlyReason({ actor, blocks, focused });
  if (!type.isUndefined(early)) {
    actor.browserOnly.push(early);
    return;
  }
  const target = findEscapeTarget({ actor, blocks, parents });
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
  const around = focused ?? readPointerFocus({ actor, block, parents });
  if (around !== null) {
    checkHeadlessPressRails({ actor, focused: around, key: 'Escape', rails });
  }
  checkHeadlessRails({ actor, blockId: block.blockId, rails, step: 'press' });
  await standIn.escape({ actor, block, state: readStandInState({ actor, block }) });
  await actor.settle();
}

export default pressEscape;
