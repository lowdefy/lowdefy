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
import { RAILED_STEPS } from '@lowdefy/node-utils';

import JourneyStepError from '../JourneyStepError.js';
import { armAuthActionRecorder } from './checkAuthActionsRan.js';

// The block types whose content area is their trigger: a click on a block in a DropdownMenu's
// content reaches the dropdown, which opens and fires onOpenChange. The headless stand-ins that
// answer it have clickContent (journey-headless BLOCK_STAND_INS).
const CONTENT_TRIGGER_TYPES = ['DropdownMenu'];

// Runs in the page. The block whose #bl-<blockId> wrapper is nearest the element (the element
// itself included), and the closest block around that one whose content is its trigger (a
// DropdownMenu), or null for either. A Modal or Drawer draws its content in a portal outside the
// wrappers around it, so the walk never reaches a trigger the click cannot.
function readClickedBlocks(element, { triggerTypes }) {
  const wrapper = element.closest('[id^="bl-"]');
  if (wrapper === null) {
    return { blockId: null, triggerId: null };
  }
  const lowdefy = window.lowdefy;
  const shownKey = lowdefy?.pageInstances?.[lowdefy?.pageId]?.at(-1);
  const blocks = lowdefy?.contexts?.[shownKey]?._internal?.RootSlots?.map ?? {};
  let around = wrapper.parentElement?.closest('[id^="bl-"]') ?? null;
  while (around !== null) {
    const id = around.id.slice(3);
    if (triggerTypes.includes(blocks[id]?.type)) {
      return { blockId: wrapper.id.slice(3), triggerId: id };
    }
    around = around.parentElement?.closest('[id^="bl-"]') ?? null;
  }
  return { blockId: wrapper.id.slice(3), triggerId: null };
}

// The Lowdefy blocks a step acts on, the one it is named by first. A `control` target is a
// control its block draws, often in a popup or modal footer outside every #bl- wrapper, and a
// `rowKey` target is a row of its block's grid, so the block is the target's own. Otherwise it is
// the nearest #bl-<blockId> wrapper of the element the step resolved to, the element itself
// included: a `text` or `containing` target has no blockId of its own, and a container target is
// acted on through the control inside it, which may be a block of its own. An element outside
// every wrapper (the input of a block that renders it in a portal, such as the Search modal) is
// the target's block when it names one. A click also acts on the DropdownMenu whose content holds
// that block (readClickedBlocks): its trigger hears the click and opens the dropdown.
async function readTargetBlockIds({ locator, target, step }) {
  if (!type.isUndefined(target?.control) || !type.isUndefined(target?.rowKey)) {
    return [target.blockId];
  }
  const clicked = await locator.evaluate(readClickedBlocks, {
    triggerTypes: CONTENT_TRIGGER_TYPES,
  });
  const blockId = clicked.blockId ?? target?.blockId ?? null;
  if (blockId === null) {
    return [];
  }
  if (step !== 'click' || clicked.triggerId === null) {
    return [blockId];
  }
  return [blockId, clicked.triggerId];
}

// On a data-set run (journey.dataSetRails), refuses a step that acts on one element (a click,
// open, fill or select, see railedSteps; a press is checkPressRails') that would reach a
// connection whose type does not declare a data-set mode the session can run (redirect or
// walled) before it acts, and starts recording the auth-engine
// actions the step runs (checkAuthActionsRan fails the step if one does). Returns the id of the
// block it acts on, or null when it is not known. Journeys without a data set act on anything.
async function checkStepRails({ journey, page, locator, target, step }) {
  if (type.isUndefined(journey.dataSetRails)) {
    return null;
  }
  await armAuthActionRecorder({ journey, page });
  const pageId = await page.evaluate(() => window.lowdefy?.pageId);
  const blockIds = await readTargetBlockIds({ locator, target, step });
  if (blockIds.length === 0) {
    return null;
  }
  if (!type.isNone(pageId)) {
    blockIds.forEach((blockId) => checkBlockRails({ journey, pageId, blockId, step }));
  }
  return blockIds[0];
}

// Throws the refusal of a step on one block of the shown page, in that step's words, when the
// data-set rails refuse it.
function checkBlockRails({ journey, pageId, blockId, step }) {
  const refused = journey.dataSetRails.refusal({ pageId, blockId, step });
  if (refused === null) {
    return;
  }
  throw new JourneyStepError(refused.message, {
    expected: `${RAILED_STEPS[step].step} a data-set journey can make`,
    actual: refused.actual,
  });
}

export { checkBlockRails };
export default checkStepRails;
