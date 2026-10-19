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

// Rows that are not data rows (an expanded detail row, a group header) may have fewer cells than
// the grid has columns; focus lands on their first cell. Skeleton rows (the initial skeleton, an
// unloaded server row) have no `data-lf-cell` cells, so a row that is not loaded yet resolves to
// null until its real row renders.
function findCellElement({ api, row, col }) {
  const scroller = api.scrollerRef.current;
  return (
    scroller?.querySelector(`[data-row-index="${row}"] [data-lf-cell][data-col-index="${col}"]`) ??
    scroller?.querySelector(`[data-row-index="${row}"] [data-lf-cell]`)
  );
}

export default findCellElement;
