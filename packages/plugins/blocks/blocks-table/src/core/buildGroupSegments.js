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

// Runs of adjacent layout columns under the same header group at `level` (null for columns with
// no group that deep, and for special columns). Columns reordered away from their group make a
// second run, so a group always sits over its own columns.
function buildGroupSegments({ cols, level, ancestorsByKey }) {
  const segments = [];
  cols.forEach((col) => {
    const node = col.special ? null : ancestorsByKey.get(col.key)?.[level] ?? null;
    const last = segments[segments.length - 1];
    if (last && last.node === node) {
      last.cols.push(col);
      return;
    }
    segments.push({ node, cols: [col] });
  });
  return segments;
}

export default buildGroupSegments;
