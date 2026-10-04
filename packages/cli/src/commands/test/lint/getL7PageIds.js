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

// The pages whose built config L7 counts as known text: the pages the
// journey's newest measured run loaded, else its start page and the pages it
// goes to.
function getL7PageIds({ journey, exercisedEntry }) {
  if (!type.isNone(exercisedEntry)) {
    return [...new Set([journey.pageId, ...exercisedEntry.exercised.pages])];
  }
  const pageIds = [journey.pageId];
  journey.steps.forEach((step) => {
    if (getStepKey(step) !== 'goto') return;
    pageIds.push(type.isString(step.goto) ? step.goto : step.goto.pageId);
  });
  return [...new Set(pageIds)];
}

export default getL7PageIds;
