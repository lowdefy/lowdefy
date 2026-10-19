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

import JourneyStepError from '../JourneyStepError.js';
import { armAuthActionRecorder } from './checkAuthActionsRan.js';

// The Lowdefy block a click lands on: the nearest #bl-<blockId> wrapper of the
// element the click resolved to, the element itself included. A `text` or
// `containing` target has no blockId of its own, and a container target is
// clicked on the control inside it, which may be a block of its own.
async function readClickedBlockId({ locator }) {
  return locator.evaluate((element) => element.closest('[id^="bl-"]')?.id.slice(3) ?? null);
}

// On a data-set run (journey.dataSetRails), refuses a click that would reach a
// connection whose type does not declare a data-set mode the session can run
// (redirect or walled) before it acts, and starts recording the auth-engine
// actions the click runs (checkAuthActionsRan fails the step if one does).
// Returns the clicked block's id, or null when it is not known. Journeys
// without a data set click anything.
async function checkClickRails({ journey, page, locator }) {
  if (type.isUndefined(journey.dataSetRails)) {
    return null;
  }
  await armAuthActionRecorder({ journey, page });
  const pageId = await page.evaluate(() => window.lowdefy?.pageId);
  const blockId = await readClickedBlockId({ locator });
  if (type.isNone(pageId) || blockId === null) {
    return blockId;
  }
  const refused = journey.dataSetRails.refusal({ pageId, blockId });
  if (refused === null) {
    return blockId;
  }
  throw new JourneyStepError(refused.message, {
    expected: 'a click a data-set journey can make',
    actual: refused.actual,
  });
}

export default checkClickRails;
