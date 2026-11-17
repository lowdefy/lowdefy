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
import { validateJourneyStub } from '@lowdefy/node-utils';

// A journey's `stubs` as the journey route and lowdefy_run_journey take them: a list of literal
// entries, each an answer stub or a forced failure (node-utils' validateJourneyStub). They live on
// the journey's data session, so a journey with stubs names its data set. A `_ref` is a journey
// file's, resolved when lowdefy test reads the file, so one sent here is refused with where it
// belongs. Returns the error, or undefined.
function validateJourneyStubs({ data, stubs }) {
  if (type.isNone(stubs)) {
    return undefined;
  }
  if (!type.isArray(stubs)) {
    return `"stubs" should be a list of answer stubs and forced failures. Received ${JSON.stringify(
      stubs
    )}.`;
  }
  if (type.isNone(data)) {
    return '"stubs" need a data set: stubs and forced failures live on the journey\'s data session. Give the journey a "data".';
  }
  for (const [index, stub] of stubs.entries()) {
    if (type.isObject(stub) && Object.hasOwn(stub, '_ref')) {
      return `"stubs[${index}]" is a _ref. Stubs are sent as literal values: a journey file that refers to shared stubs runs through lowdefy test (lowdefy_run_tests), which reads its _ref.`;
    }
    const { error } = validateJourneyStub({ stub });
    if (!type.isUndefined(error)) {
      return `"stubs[${index}]": ${error}`;
    }
  }
  return undefined;
}

export default validateJourneyStubs;
