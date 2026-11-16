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

import createMatcher from './createMatcher.js';

// Matches a string that the regular expression matches, or that contains the given text.
function stringMatching(pattern) {
  const isRegExp = pattern instanceof RegExp;
  if (!isRegExp && typeof pattern !== 'string') {
    throw new TypeError('stringMatching() takes a regular expression or a string.');
  }
  return createMatcher({
    description: `stringMatching(${isRegExp ? String(pattern) : JSON.stringify(pattern)})`,
    matches: (actual) => {
      if (typeof actual !== 'string') return false;
      if (!isRegExp) return actual.includes(pattern);
      // A global or sticky expression keeps its position between calls.
      pattern.lastIndex = 0;
      return pattern.test(actual);
    },
  });
}

export default stringMatching;
