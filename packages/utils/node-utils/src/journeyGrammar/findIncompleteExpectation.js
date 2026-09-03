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

// A state expectation with a path and no `equals` asserts nothing, so a runner
// must never report it as passed: `lowdefy test --update` fills it from the
// observed state and every other runner refuses it with this message. Returns
// the first one, or undefined when every expectation is filled.
function findIncompleteExpectation({ steps }) {
  if (!type.isArray(steps)) {
    return undefined;
  }
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const state = type.isObject(step) && type.isObject(step.expect) ? step.expect.state : undefined;
    if (type.isObject(state) && !('equals' in state)) {
      return {
        index,
        path: state.path,
        message: `Incomplete expectation at step ${index}: "expect.state" for path "${state.path}" has no "equals". Run lowdefy test --update to fill it from the observed state.`,
      };
    }
  }
  return undefined;
}

export default findIncompleteExpectation;
