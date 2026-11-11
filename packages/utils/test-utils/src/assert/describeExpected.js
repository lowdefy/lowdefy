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

import isMatcher from './isMatcher.js';
import isPlainObject from './isPlainObject.js';

// The expected value with each matcher replaced by its description, so a failed assertion
// prints "any(String)" where the test wrote any(String).
function describeExpected(expected) {
  if (isMatcher(expected)) return `<${expected.description}>`;
  if (Array.isArray(expected)) return expected.map((item) => describeExpected(item));
  if (isPlainObject(expected)) {
    return Object.fromEntries(
      Object.entries(expected).map(([key, value]) => [key, describeExpected(value)])
    );
  }
  return expected;
}

export default describeExpected;
