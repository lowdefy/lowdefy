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
import isPlainObject from './isPlainObject.js';

// Matches an object that holds every key of `expected` with a matching value, and may hold
// more. Inside assertEquals it relaxes one object; assertMatches treats every object this way.
function objectContaining(expected) {
  if (!isPlainObject(expected)) {
    throw new TypeError('objectContaining() takes an object of the keys to look for.');
  }
  return createMatcher({
    description: 'objectContaining(...)',
    matches: (actual, compare) => compare(actual, expected, { partial: true }) === null,
  });
}

export default objectContaining;
