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
import { findStepNeedingPage, getStepKey } from '@lowdefy/node-utils';

// Why a journey with no pageId cannot run, or undefined when it can: every step runs without a
// page (call, request and the checks on them) and there is at least one. Worded to follow the
// caller's name: `runJourney requires a "pageId" string: ...`. Runs on valid steps.
function describePageNeed({ steps }) {
  if (steps.length === 0) {
    return 'requires a "pageId" string: a journey with no steps opens a page. Received undefined.';
  }
  const found = findStepNeedingPage({ steps });
  if (type.isUndefined(found)) {
    return undefined;
  }
  return `requires a "pageId" string: step ${found.index} (${getStepKey(
    found.step
  )}) needs a page. Received undefined.`;
}

export default describePageNeed;
