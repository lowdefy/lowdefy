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

// The column manager's lists from table state: displayed columns in the order the table shows
// them (start-pinned, centre, end-pinned), then the columns the view hides, then the columns a
// column group's state hides (`unavailable`: the view shows them, a collapsed or expanded group
// does not), each in view order. `displayedVisibility` is the view's visibility with the
// column groups applied (core/getDisplayedVisibility.js).
function getManagerEntries({ state, displayedVisibility }) {
  const { columnOrder, columnPinning, columnVisibility } = state;
  const isDisplayed = (key) => displayedVisibility[key] !== false;
  const isHidden = (key) => columnVisibility[key] === false;
  const pinned = new Set([...columnPinning.start, ...columnPinning.end]);
  return {
    start: columnPinning.start.filter(isDisplayed),
    center: columnOrder.filter((key) => isDisplayed(key) && !pinned.has(key)),
    end: columnPinning.end.filter(isDisplayed),
    hidden: columnOrder.filter(isHidden),
    unavailable: columnOrder.filter((key) => !isDisplayed(key) && !isHidden(key)),
  };
}

export default getManagerEntries;
