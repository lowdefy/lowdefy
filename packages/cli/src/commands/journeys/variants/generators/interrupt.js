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

import findSubmitClick from '../findSubmitClick.js';
import targetName from '../targetName.js';
import writeCall from '../writeCall.js';

const INTERACTION_STEPS = ['click', 'open', 'press', 'back', 'goto', 'fill', 'select'];

// Interrupt: when the submit click is on the start page (its write request
// is that page's), the steps before it, a full load of the start page (page
// state reset, app events run again), the start page's steps again from its
// first interaction to the end, and the write sent exactly once.
function interrupt({ journey, exercised }) {
  const submit = findSubmitClick({ journey, exercised });
  if (type.isNull(submit)) {
    return { skipped: 'no submit click: no click followed by a wait for a write request' };
  }
  if (submit.write.pageId !== journey.pageId) {
    return { skipped: 'the submit click is not on the start page' };
  }
  const first = journey.steps.findIndex((step) => INTERACTION_STEPS.includes(getStepKey(step)));
  const reload = type.isNone(journey.urlQuery)
    ? { goto: journey.pageId }
    : { goto: { pageId: journey.pageId, urlQuery: journey.urlQuery } };
  const steps = [
    ...journey.steps.slice(0, submit.index),
    reload,
    ...journey.steps.slice(first),
    writeCall({ write: submit.write, count: 1 }),
  ];
  const target = targetName(journey.steps[submit.index].click);
  return [{ kind: 'interrupt', detail: `reload before "${target}"`, steps }];
}

export default interrupt;
