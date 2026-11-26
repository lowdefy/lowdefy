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

import collectBlockParents from './collectBlockParents.js';
import { checkNumberInputBlur } from './fillNumberInput.js';
import readFocusedInput from './readFocusedInput.js';
import readShownBlock from './readShownBlock.js';
import isInsideBlock from './standIns/isInsideBlock.js';

// Whether the popup, as it closes, hands the focus back to the element that had it when the popup
// opened. rc-dialog (a Modal, a ConfirmModal) does while its mask is on and focusTriggerAfterClose
// is truthy; rc-drawer whenever focusTriggerAfterClose is not false. antd spreads the block's
// `focusable` over its default of true, so the key set to null counts as null.
function restoresFocus({ block }) {
  const properties = block.eval.properties ?? {};
  const focusable = type.isObject(properties.focusable) ? properties.focusable : {};
  const trigger = Object.hasOwn(focusable, 'focusTriggerAfterClose')
    ? focusable.focusTriggerAfterClose
    : true;
  if (block.type === 'Drawer') {
    return trigger !== false;
  }
  const masked = properties.mask !== false && properties.mask?.enabled !== false;
  return masked && Boolean(trigger);
}

// The focus leaves `input` (or no input): a NumberInput's blur flushes its text, which marks the
// step browser-only when the flush changes the number (checkNumberInputBlur).
function leaveInput({ actor, input }) {
  actor.page.inputFocused = false;
  if (input === null || input.type !== 'NumberInput') {
    return;
  }
  const flushed = checkNumberInputBlur({ actor, block: input });
  if (!type.isUndefined(flushed)) {
    actor.browserOnly.push(flushed);
  }
}

// Moves the focus as a popup (POPUP_BLOCK_TYPES) opening or closing moves it in a browser, once
// setOpen has changed its open state. Opening, rc-dialog and rc-drawer focus the popup's own panel
// and keep the element the focus left (page.focusReturns keeps the input, or null for none).
// Closing, a popup that hands the focus back (restoresFocus) focuses that element again, which
// gives the input back the focus while the page still shows it; one that does not leaves the
// focus where it is, unless it was inside the popup, where it is lost. The input the focus leaves
// blurs (leaveInput), and the input handed the focus back is the one a press acts on again.
function movePopupFocus({ actor, block, open }) {
  const { page } = actor;
  const focused = readFocusedInput({ actor });
  if (open) {
    page.focusReturns.set(block.id, focused?.blockId ?? null);
    leaveInput({ actor, input: focused });
    return;
  }
  const returnTo = page.focusReturns.get(block.id) ?? null;
  page.focusReturns.delete(block.id);
  if (!restoresFocus({ block })) {
    const { parents } = collectBlockParents({ context: page.context });
    if (focused !== null && isInsideBlock({ block: focused, container: block, parents })) {
      leaveInput({ actor, input: focused });
    }
    return;
  }
  const input = returnTo === null ? null : readShownBlock({ actor, blockId: returnTo });
  if (focused?.blockId !== input?.blockId) {
    leaveInput({ actor, input: focused });
  }
  if (input === null) {
    page.inputFocused = false;
    return;
  }
  page.inputFocused = true;
  actor.stepRunner.setLastInputBlockId(input.blockId);
}

export default movePopupFocus;
