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

const WALK_STEP_KINDS = ['click', 'fill', 'select'];

// A walk step is one grammar interaction: { click: target }, or { fill } /
// { select } with a target and a value. Returns an error message, or
// undefined when the step is well formed.
function validateWalkStep(step) {
  if (!type.isObject(step) || Object.keys(step).length !== 1) {
    return `A walk step must be one of ${WALK_STEP_KINDS.join(
      ', '
    )} with its target. Received ${JSON.stringify(step)}.`;
  }
  const [kind] = Object.keys(step);
  if (!WALK_STEP_KINDS.includes(kind)) {
    return `A walk step must be one of ${WALK_STEP_KINDS.join(', ')}. Received "${kind}".`;
  }
  if (kind === 'click') {
    if (!type.isObject(step.click)) {
      return `A walk click step's target must be an object. Received ${JSON.stringify(
        step.click
      )}.`;
    }
    return undefined;
  }
  const params = step[kind];
  if (!type.isObject(params) || !(type.isString(params.value) || type.isNumber(params.value))) {
    return `A walk ${kind} step must be an object with a target and a string or number "value". Received ${JSON.stringify(
      params
    )}.`;
  }
  return undefined;
}

export default validateWalkStep;
