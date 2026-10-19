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

import useTanstackRowWindow from './useTanstackRowWindow.js';

// The `positioned` row window strategy (the bench-only `rowWindowStrategy`): TanStack Virtual's
// range and per-row positioning in place of the translated window, when rows are virtualised and
// one row high.
function usePositionedRows({
  headerHeight,
  range,
  rowHeight,
  rowOffsets,
  rows,
  scrollerRef,
  virtualRows,
}) {
  const positioned = virtualRows && rowOffsets === null;
  const tanstackRows = useTanstackRowWindow({
    enabled: positioned,
    headerHeight,
    rowCount: rows.length,
    rowHeight,
    scrollerRef,
  });
  if (!positioned || !tanstackRows) return {};
  return { range: { ...range, ...tanstackRows, positioning: 'positioned' } };
}

export default usePositionedRows;
