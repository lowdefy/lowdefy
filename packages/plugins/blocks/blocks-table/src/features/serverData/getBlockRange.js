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

// The block indexes that hold rows `startRow` (inclusive) to `endRow` (exclusive), clipped to
// `total` when it is known. `first > last` when the range is empty.
function getBlockRange({ startRow, endRow, blockSize, total }) {
  const end = typeof total === 'number' ? Math.min(endRow, total) : endRow;
  const start = Math.max(0, startRow);
  if (end <= start) return { first: 0, last: -1 };
  return { first: Math.floor(start / blockSize), last: Math.floor((end - 1) / blockSize) };
}

export default getBlockRange;
