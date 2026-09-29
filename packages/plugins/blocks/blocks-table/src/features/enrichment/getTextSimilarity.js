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

function levenshtein(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

// How alike two normalised texts are, from 0 to 1: the edit distance between them (spaces
// ignored) over the longer one's length, so "Emails" and "email" score 0.83 and "Industy" and
// "industry" 0.875, while unrelated words score low.
function getTextSimilarity(a, b) {
  const left = a.replace(/ /g, '');
  const right = b.replace(/ /g, '');
  const length = Math.max(left.length, right.length);
  if (length === 0) return 0;
  return 1 - levenshtein(left, right) / length;
}

export default getTextSimilarity;
