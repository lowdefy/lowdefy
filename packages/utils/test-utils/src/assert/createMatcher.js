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

import matcherKey from './matcherKey.js';

// A matcher stands in an expected value for "any value that passes this test". `matches` is
// given the actual value and compare(actual, expected), which returns null when the two match
// by the rules of the assertion that is running. `description` is what a failed assertion
// prints as the expected value.
function createMatcher({ description, matches }) {
  return { [matcherKey]: true, description, matches };
}

export default createMatcher;
