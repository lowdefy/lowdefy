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

import { useMemo, useRef } from 'react';

import computeRowOffsets from './computeRowOffsets.js';
import features from '../features/index.js';
import isDataItem from './isDataItem.js';

// Stage 5 of the data pipeline (see TableRoot): the display list the body windows over. It starts
// as TanStack's row model rows; each `useItems(ctx)` hook, in registry order, may return
// `{ rows }` to replace it with display items: server mode's rows, group headers and `undefined`
// holes for rows not loaded yet; client grouping's group headers; tree rows with a depth; and
// expanded detail rows after their row. A TanStack row is a data item as it is; other items
// carry `kind` ('row' for wrapped data rows, 'group', 'detail') and `key` (wrapped rows: `id`
// and `original`). A hook returns null when it has nothing to change.
//
// A hook may also return:
// - `dataRows`: the view's data rows in display order when the list leaves some out (rows in
//   collapsed groups); export reads `api.dataRows`. By default it is the list's data items.
// - `rowHeights(item, index)`: the height of items that are not one row high (a measured detail
//   row). The body then positions items by the offsets built from them.
function useFeatureItems(ctx) {
  let rows = ctx.rows;
  let dataRows = null;
  const heightFns = [];
  features.forEach((feature) => {
    if (!feature.useItems) return;
    const result = feature.useItems({ ...ctx, rows });
    if (!result) return;
    rows = result.rows;
    if (result.dataRows) dataRows = result.dataRows;
    if (result.rowHeights) heightFns.push(result.rowHeights);
  });
  const listDataRows = useMemo(
    () => (rows === ctx.rows ? rows : rows.filter(isDataItem)),
    [rows, ctx.rows]
  );
  // Memoised by hand: the number of height functions changes with config.
  const memo = useRef({ inputs: [], rowOffsets: null });
  const inputs = [rows, ctx.rowHeight, ...heightFns];
  const same =
    inputs.length === memo.current.inputs.length &&
    inputs.every((input, index) => input === memo.current.inputs[index]);
  if (!same) {
    memo.current = {
      inputs,
      rowOffsets:
        heightFns.length === 0
          ? null
          : computeRowOffsets({ rows, rowHeight: ctx.rowHeight, heightFns }),
    };
  }
  return { dataRows: dataRows ?? listDataRows, rows, rowOffsets: memo.current.rowOffsets };
}

export default useFeatureItems;
