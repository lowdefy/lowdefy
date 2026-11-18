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

// The rows of a grid (readGrid's rows: { row, key, index }, key null for a row whose key the grid
// generated) whose key is `rowKey`, compared as text, as the browser compares the row's key
// attribute: a numeric id matches its digits.
function matchGridRows({ rows, rowKey }) {
  const wanted = String(rowKey);
  return rows.filter((entry) => entry.key !== null && String(entry.key) === wanted);
}

export default matchGridRows;
