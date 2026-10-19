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

const MIN = 40;
const MAX = 90;

// FNV-1a over the column key, so every column gets its own sequence.
function hashKey(key) {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// A skeleton bar's width in percent of its cell, pseudo-random but stable: the same row and
// column always get the same width, so skeleton rows neither flicker on re-render nor line up
// into columns of equal bars.
function getSkeletonWidth({ rowIndex, columnKey }) {
  let x = (hashKey(String(columnKey)) ^ Math.imul(rowIndex + 1, 2654435761)) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 2246822507) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 3266489909) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return MIN + (x % (MAX - MIN + 1));
}

export default getSkeletonWidth;
