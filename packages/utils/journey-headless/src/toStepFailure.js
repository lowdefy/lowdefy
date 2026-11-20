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

import { getStepKey } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import HeadlessStepError from './HeadlessStepError.js';

// A step's own failure, in the browser runner's shape: { index, step, expected, actual, message }.
// A check that did not hold says what it expected and found; any other error says the step did
// not complete.
function toStepFailure({ error, index, step }) {
  if (error instanceof HeadlessStepError) {
    return {
      index,
      step,
      expected: error.expected,
      actual: type.isUndefined(error.actual) ? null : error.actual,
      message: error.message,
    };
  }
  return {
    index,
    step,
    expected: `step ${index} (${getStepKey(step)}) to complete`,
    actual: error.message,
    message: error.message,
  };
}

export default toStepFailure;
