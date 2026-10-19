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

// Per group level, the list indices of that level's headers (`own`) and of the headers at that
// level or above (`upTo`, the headers that end a group of that level), for the stacked sticky
// headers' binary searches. Built once per display list.
function buildStickyLevels({ groupIndices, levelCount, rows }) {
  const own = Array.from({ length: levelCount }, () => []);
  const upTo = Array.from({ length: levelCount }, () => []);
  for (const index of groupIndices) {
    const { depth } = rows[index];
    own[depth].push(index);
    for (let level = depth; level < levelCount; level++) upTo[level].push(index);
  }
  return own.map((indices, level) => ({
    own: Uint32Array.from(indices),
    upTo: Uint32Array.from(upTo[level]),
  }));
}

export default buildStickyLevels;
