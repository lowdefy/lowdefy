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

// The Lowdefy block a step acts on. A `control` target is a control its block draws, often
// in a popup or modal footer outside every #bl- wrapper, and a `rowKey` target is a row of its
// block's grid, so the block is the target's own. Otherwise it is the nearest #bl-<blockId>
// wrapper of the element the step resolved to, the element itself included: a `text` or
// `containing` target has no blockId of its own, and a container target is acted on through
// the control inside it, which may be a block of its own. An element outside every wrapper
// (the input of a block that renders it in a portal, such as the Search modal) is the
// target's block when it names one.
async function readTargetBlockId({ locator, target }) {
  if (!type.isUndefined(target?.control) || !type.isUndefined(target?.rowKey)) {
    return target.blockId;
  }
  const wrapped = await locator.evaluate(
    (element) => element.closest('[id^="bl-"]')?.id.slice(3) ?? null
  );
  return wrapped ?? target?.blockId ?? null;
}

// On a data-set run (journey.dataSetRails), refuses a step that acts on one element (a click,
// open, fill or select, see railedSteps; a press is checkPressRails') that would reach a
// connection whose type does not declare a data-set mode the session can run (redirect or
// walled) before it acts, and starts recording the auth-engine
// actions the step runs (checkAuthActionsRan fails the step if one does). Returns the block's
// id, or null when it is not known. Journeys without a data set act on anything.
async function checkStepRails({ journey, page, locator, target, step }) {
  if (type.isUndefined(journey.dataSetRails)) {
    return null;
  }
  await armAuthActionRecorder({ journey, page });
  const pageId = await page.evaluate(() => window.lowdefy?.pageId);
  const blockId = await readTargetBlockId({ locator, target });
  if (type.isNone(pageId) || blockId === null) {
    return blockId;
  }
  checkBlockRails({ journey, pageId, blockId, step });
  return blockId;
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
