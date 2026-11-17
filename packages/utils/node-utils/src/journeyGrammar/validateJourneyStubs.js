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

import validateJourneyStub from './validateJourneyStub.js';

// A journey's `stubs`: a list of entries, each an answer stub or a forced failure
// (validateJourneyStub). Whether the journey has the data set they live on is
// validateJourneyDataSession's. Returns { error } naming the first bad entry by its place, or {}.
function validateJourneyStubs({ stubs }) {
  if (type.isNone(stubs)) {
    return {};
  }
  if (!type.isArray(stubs)) {
    return {
      error: `Journey "stubs" should be a list of answer stubs and forced failures. Received ${JSON.stringify(
        stubs
      )}.`,
    };
  }
  for (const [index, stub] of stubs.entries()) {
    const { error } = validateJourneyStub({ stub });
    if (!type.isUndefined(error)) {
      return { error: `Journey "stubs[${index}]": ${error}` };
    }
  }
  return {};
}

export default validateJourneyStubs;
