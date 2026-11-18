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
import { findJourneyPlaceholder } from '@lowdefy/node-utils';

// A journey sent to the journey route or lowdefy_run_journey takes literal values: a `_ref` or
// `_case` in it (node-utils' findJourneyPlaceholder) would be sent as a literal object, so it is
// refused with where it belongs. Returns the error, or undefined.
function findSentPlaceholder({ data, pageId, pathParams, steps, stubs, urlQuery, user }) {
  const { error } = findJourneyPlaceholder({
    journey: { pageId, pathParams, urlQuery, user, data, stubs, steps },
  });
  if (type.isUndefined(error)) {
    return undefined;
  }
  return `${error} A journey sent here takes literal values: a journey file with cases or _ref runs through lowdefy test (lowdefy_run_tests), which reads them.`;
}

export default findSentPlaceholder;
