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

// Arrow keys, Home/End (row ends), Ctrl/Cmd+Home/End (grid corners) and PageUp/PageDown (one
// body height). Row -1 is the header row.
function getNextCell({ event, api, row, col }) {
  const lastRow = api.rows.length - 1;
  const lastCol = api.layout.cols.length - 1;
  const modified = event.ctrlKey || event.metaKey;
  const scroller = api.scrollerRef.current;
  const pageRows = Math.max(
    1,
    Math.floor((scroller.clientHeight - api.headerHeight) / api.rowHeight) - 1
  );
  switch (event.key) {
    case 'ArrowUp':
      return { row: Math.max(-1, row - 1), col };
    case 'ArrowDown':
      return { row: Math.min(lastRow, row + 1), col };
    case 'ArrowLeft':
      return { row, col: Math.max(0, col - 1) };
    case 'ArrowRight':
      return { row, col: Math.min(lastCol, col + 1) };
    case 'Home':
      return modified ? { row: Math.min(0, lastRow), col: 0 } : { row, col: 0 };
    case 'End':
      return modified ? { row: lastRow, col: lastCol } : { row, col: lastCol };
    case 'PageUp':
      return { row: row < 0 ? row : Math.max(0, row - pageRows), col };
    case 'PageDown':
      return { row: Math.min(lastRow, Math.max(0, row) + pageRows), col };
    default:
      return null;
  }
}

export default getNextCell;
