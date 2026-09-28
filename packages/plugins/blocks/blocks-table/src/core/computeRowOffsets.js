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

// Top offset of every display item (length n + 1; the last entry is the body height) for lists
// where some items are not one row high. The first height function that answers for an item wins.
function computeRowOffsets({ rows, rowHeight, heightFns }) {
  const offsets = new Float64Array(rows.length + 1);
  let top = 0;
  for (let i = 0; i < rows.length; i++) {
    offsets[i] = top;
    let height;
    for (let f = 0; f < heightFns.length && height === undefined; f++) {
      height = heightFns[f](rows[i], i);
    }
    top += height ?? rowHeight;
  }
  offsets[rows.length] = top;
  return offsets;
}

export default computeRowOffsets;
