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

// Passes when actual equals expected at every depth: the same keys, the same items in the same
// order, and equal values. A key whose value is undefined counts as absent. A matcher in
// expected (any, anything, objectContaining, arrayContaining, stringMatching) stands for the
// values it accepts. Fails naming the first difference.
function assertEquals(actual, expected, message) {
  const found = compareValues({ actual, expected, partial: false, path: [] });
  if (found !== null) {
    throwDifference({ actual, assertion: assertEquals, expected, found, message });
  }
}

export default assertEquals;
