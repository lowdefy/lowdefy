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

import { timeSync } from './prof.js';
import { RAILED_STEPS } from '@lowdefy/node-utils';

import HeadlessStepError from './HeadlessStepError.js';

// On a data-set journey, refuses a step (a click, open, fill, select or press, see RAILED_STEPS)
// before it acts when the block it acts on has events that reach a connection a data set cannot
// run against, with the browser runner's message (checkStepRails in @lowdefy/server-dev). rails is
// the run's createDataSetRails, or null for a journey with no data set, which acts on anything.
function checkHeadlessRails({ actor, blockId, rails, step }) {
  if (rails === null) {
    return;
  }
  const refused = timeSync('rails.refusal', () => rails.refusal({ pageId: actor.page.pageId, blockId, step }));
  if (refused === null) {
    return;
  }
  throw new HeadlessStepError(refused.message, {
    expected: `${RAILED_STEPS[step].step} a data-set journey can make`,
    actual: refused.actual,
  });
}

export default checkHeadlessRails;
