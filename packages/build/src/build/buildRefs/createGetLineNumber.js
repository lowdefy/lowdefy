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

// Counting the newlines before each offset made a file's line numbers cost
// O(nodes x file size), a fifth of a large app's build. The newline offsets are
// collected once per file and each lookup is a binary search over them.
function createGetLineNumber(content) {
  const newlineOffsets = [];
  for (let index = content.indexOf('\n'); index !== -1; index = content.indexOf('\n', index + 1)) {
    newlineOffsets.push(index);
  }
  return function getLineNumber(offset) {
    if (offset == null || offset < 0) return null;
    let low = 0;
    let high = newlineOffsets.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (newlineOffsets[mid] < offset) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    // low is the number of newlines before offset.
    return low + 1;
  };
}

export default createGetLineNumber;
