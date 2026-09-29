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

// The column manager's lists from table state: visible columns in the order the table shows them
// (start-pinned, centre, end-pinned), then hidden columns in view order.
function getManagerEntries({ state }) {
  const { columnOrder, columnPinning, columnVisibility } = state;
  const isVisible = (key) => columnVisibility[key] !== false;
  const pinned = new Set([...columnPinning.start, ...columnPinning.end]);
  return {
    start: columnPinning.start.filter(isVisible),
    center: columnOrder.filter((key) => isVisible(key) && !pinned.has(key)),
    end: columnPinning.end.filter(isVisible),
    hidden: columnOrder.filter((key) => !isVisible(key)),
  };
}

export default getManagerEntries;
