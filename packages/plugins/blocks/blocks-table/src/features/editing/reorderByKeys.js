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

// Rows in the order of a key list (a move without a position field). Rows the list does not
// name (rows that arrived after the move) follow, in their own order.
function reorderByKeys({ rows, order, getKey }) {
  const rank = new Map(order.map((key, index) => [String(key), index]));
  return rows
    .map((row, index) => ({ row, index, rank: rank.get(String(getKey(row))) }))
    .sort((a, b) => {
      const aRanked = a.rank !== undefined;
      const bRanked = b.rank !== undefined;
      if (aRanked && bRanked) return a.rank - b.rank;
      if (aRanked !== bRanked) return aRanked ? -1 : 1;
      return a.index - b.index;
    })
    .map((item) => item.row);
}

export default reorderByKeys;
