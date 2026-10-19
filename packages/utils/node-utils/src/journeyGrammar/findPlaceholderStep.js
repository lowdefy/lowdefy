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

function placeholderOf(step) {
  const key = getStepKey(step);
  const params = step[key];
  if (!type.isObject(params)) return undefined;
  if ((key === 'fill' || key === 'select') && params.from === 'shape') {
    return { verb: key, name: params.blockId };
  }
  if (key === 'expect' && type.isObject(params.state) && params.state.from === 'shape') {
    return { verb: 'expect.state', name: params.state.path };
  }
  return undefined;
}

// A `from: shape` value is a placeholder the trace could not hold (a production
// value, a redacted password). Running it would type null into a field and
// report whatever followed as the app's fault, so the runner refuses the
// journey before a browser opens. Takes steps that already passed
// validateJourneySteps; returns { error } naming the first placeholder, or {}.
function findPlaceholderStep({ steps }) {
  for (let index = 0; index < steps.length; index += 1) {
    const placeholder = placeholderOf(steps[index]);
    if (!type.isUndefined(placeholder)) {
      return {
        error: `Step ${index}: ${placeholder.verb} on "${placeholder.name}" has a placeholder value (from: shape). Fill it from the data set or the journey's user, then remove from.`,
      };
    }
  }
  return {};
}

export default findPlaceholderStep;
