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

// Each row's top offset in the body, and the body height last (`rows.length + 1` entries): the
// measured height where the row has been rendered, `rowHeight` where it has not.
function computeRowOffsets({ rows, rowHeight, heights }) {
  const count = rows.length;
  const offsets = new Float64Array(count + 1);
  let top = 0;
  for (let i = 0; i < count; i++) {
    offsets[i] = top;
    top += heights.get(rows[i].id) ?? rowHeight;
  }
  offsets[count] = top;
  return offsets;
}

export default computeRowOffsets;
