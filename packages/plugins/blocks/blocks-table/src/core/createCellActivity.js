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

// Which rows may mount their tier-1 cells (D4, D10.4): the hovered row, the row holding focus, and
// whether the grid is scrolling fast. A small external store, so a change re-renders only the lazy
// cells whose answer changes, never the rows or the grid.
function createCellActivity() {
  const listeners = new Set();
  const state = { focusedRow: null, hoveredRow: null, fastScrolling: false };
  // Devices without hover show `showOn: hover` buttons all the time (see tableCells.css).
  const noHover =
    typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches === true;
  function set(partial) {
    let changed = false;
    Object.entries(partial).forEach(([key, value]) => {
      if (state[key] === value) return;
      state[key] = value;
      changed = true;
    });
    if (changed) listeners.forEach((listener) => listener());
  }
  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
  return { noHover, set, state, subscribe };
}

export default createCellActivity;
