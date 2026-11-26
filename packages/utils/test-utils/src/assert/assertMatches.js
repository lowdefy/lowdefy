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

import compareValues from './compareValues.js';
import throwDifference from './throwDifference.js';

// Passes when actual holds everything expected names: an object may carry more keys than
// expected lists, at every depth, so a test names only the fields it is about. Arrays match
// item for item, and values must be equal. A matcher in expected (any, anything,
// objectContaining, arrayContaining, stringMatching) stands for the values it accepts. Fails
// naming the first difference.
function assertMatches(actual, expected, message) {
  const found = compareValues({ actual, expected, partial: true, path: [] });
  if (found !== null) {
    throwDifference({ actual, assertion: assertMatches, expected, found, message });
  }
}

export default assertMatches;
