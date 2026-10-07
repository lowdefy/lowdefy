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

const MIN_TERM_LENGTH = 3;

const COMMON_WORDS = new Set([
  'about',
  'all',
  'and',
  'any',
  'are',
  'can',
  'does',
  'for',
  'from',
  'has',
  'have',
  'how',
  'into',
  'not',
  'the',
  'this',
  'that',
  'use',
  'using',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'will',
  'with',
  'you',
  'your',
]);

// Underscores, dots and dollar signs stay inside a term, so operator names
// like _string.concat and $match are searched as written.
function splitSearchTerms({ query }) {
  const terms = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}_.$]+/u)
    .map((term) => term.replace(/^\.+|\.+$/g, ''))
    .filter((term) => term.length >= MIN_TERM_LENGTH && !COMMON_WORDS.has(term));
  return [...new Set(terms)];
}

export default splitSearchTerms;
