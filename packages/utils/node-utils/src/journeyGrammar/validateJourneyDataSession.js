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

import { getStepKey } from './validateJourneySteps.js';

const GIVE_DATA = 'Give the journey a "data".';

function describeStepNeed({ index, step }) {
  const key = getStepKey(step);
  if (key === 'hold' || key === 'release') {
    return `Step ${index}: "${key}" needs a data set: its gate lives on the journey's data session. ${GIVE_DATA}`;
  }
  if (key === 'expect' && getStepKey(step.expect) === 'sunk') {
    return `Step ${index}: expect.sunk needs a data set: it reads the requests the journey's data session recorded. ${GIVE_DATA}`;
  }
  return undefined;
}

// What lives on a journey's data session needs one, so a journey without `data` that sets stubs
// or forced failures, holds or releases a request, or checks expect.sunk is refused, the same way
// by lowdefy test and every host: a host that opens a session with no data set would run it, and
// one that opens none would not. Runs on steps validateJourneySteps accepted. Returns { error }
// or {}.
function validateJourneyDataSession({ data, steps, stubs }) {
  if (!type.isNone(data)) {
    return {};
  }
  // An empty list asks for nothing, so it needs no data set.
  if (!type.isNone(stubs) && !(type.isArray(stubs) && stubs.length === 0)) {
    return {
      error: `Journey "stubs" need a data set: stubs and forced failures live on the journey's data session. ${GIVE_DATA}`,
    };
  }
  for (const [index, step] of steps.entries()) {
    const error = describeStepNeed({ index, step });
    if (!type.isUndefined(error)) {
      return { error };
    }
  }
  return {};
}

export default validateJourneyDataSession;
