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

const TARGET_STEPS = ['click', 'open', 'fill', 'select'];
const TARGET_EXPECTS = ['visible', 'hidden', 'text'];

// The target a step acts on or asserts about (a blockId string or a target
// object), or null for a step with none.
function stepTarget(step) {
  const key = getStepKey(step);
  if (TARGET_STEPS.includes(key)) {
    return step[key];
  }
  if (key === 'expect') {
    const expectKey = getStepKey(step.expect);
    if (TARGET_EXPECTS.includes(expectKey)) {
      return step.expect[expectKey];
    }
  }
  return null;
}

// The blockId a target names, or null.
function targetBlockId(target) {
  if (type.isString(target)) {
    return target;
  }
  return type.isObject(target) && type.isString(target.blockId) ? target.blockId : null;
}

export { targetBlockId };
export default stepTarget;
