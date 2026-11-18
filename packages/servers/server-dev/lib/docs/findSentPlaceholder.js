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

const FILE_NOTE =
  'A journey sent here takes literal values: a journey file with cases or _ref runs through lowdefy test (lowdefy_run_tests), which reads them.';

// A journey sent to the journey route or lowdefy_run_journey takes literal values and runs once.
// A case table (`cases`, any value) is refused: one run would send each `_case` as a literal
// object. A `_ref` or `_case` where a journey file's placeholder could have been meant (a step,
// a step list, a stub, user, data, pageId, or pathParams and urlQuery or one of their values:
// node-utils' findJourneyPlaceholder with literal) is refused with where it belongs; one inside
// a value is sent as written. Returns the error, or undefined.
function findSentPlaceholder({ cases, data, pageId, pathParams, steps, stubs, urlQuery, user }) {
  if (!type.isUndefined(cases)) {
    return `A journey sent here runs once and takes no "cases" table: case tables run through lowdefy test (lowdefy_run_tests), one run per row. Send one row's values in place of each _case, or run the journey file. Received "cases": ${JSON.stringify(
      cases
    )}.`;
  }
  const { error } = findJourneyPlaceholder({
    journey: { pageId, pathParams, urlQuery, user, data, stubs, steps },
    literal: true,
  });
  if (type.isUndefined(error)) {
    return undefined;
  }
  return `${error} ${FILE_NOTE}`;
}

export default findSentPlaceholder;
