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
import { getStepKey } from '@lowdefy/node-utils';

// The pages a journey names: the page it opens and every page a goto, a request step or an
// expect.calls on a request names. The dev server builds pages on demand, so a headless run builds
// these first, for the step checks that read their artifacts.
function listStepPageIds({ pageId, steps }) {
  const pageIds = new Set(type.isString(pageId) ? [pageId] : []);
  steps.forEach((step) => {
    const key = getStepKey(step);
    if (key === 'goto') {
      pageIds.add(type.isString(step.goto) ? step.goto : step.goto.pageId);
    } else if (key === 'request') {
      pageIds.add(step.request.pageId);
    } else if (key === 'expect' && getStepKey(step.expect) === 'calls') {
      const { pageId: callsPageId } = step.expect.calls;
      if (type.isString(callsPageId)) pageIds.add(callsPageId);
    }
  });
  return [...pageIds];
}

export default listStepPageIds;
