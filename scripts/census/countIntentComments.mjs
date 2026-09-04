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

const commentLine = /^\s*#/;

// The words a comment reaches for when it is carrying a rule the config itself
// cannot state — "never do X", "must be Y", "because Z". A high count is the
// framework's missing semantics written out by hand.
const intentWords = /\b(never|must|because|otherwise|so that)\b/i;

function countIntentComments({ lines }) {
  let commentLines = 0;
  let intentLines = 0;
  for (const line of lines) {
    if (!commentLine.test(line)) {
      continue;
    }
    commentLines += 1;
    if (intentWords.test(line)) {
      intentLines += 1;
    }
  }
  return { commentLines, intentLines };
}

export default countIntentComments;
