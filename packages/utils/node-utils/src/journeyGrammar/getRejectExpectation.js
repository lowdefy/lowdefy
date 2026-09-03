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

import getStepKey from './getStepKey.js';

// A request test's `expect` that is an object with exactly the one key `reject`
// asserts a refusal instead of a response, so the runner must invert its
// success/failure branch. Returns the rejection params, or undefined.
function getRejectExpectation(expected) {
  if (getStepKey(expected) !== 'reject') {
    return undefined;
  }
  if (!type.isObject(expected.reject)) {
    return undefined;
  }
  return expected.reject;
}

export default getRejectExpectation;
