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

import isDataItem from './isDataItem.js';

function combineHeights(heightFns) {
  if (heightFns.length === 0) return null;
  if (heightFns.length === 1) return heightFns[0];
  return function rowHeights(item, index) {
    for (let f = 0; f < heightFns.length; f++) {
      const height = heightFns[f](item, index);
      if (height !== undefined) return height;
    }
    return undefined;
  };
}

// Stage 5 of the data pipeline (see TableRoot): the display list the body windows over. It starts
// as TanStack's row model rows; each `useItems(ctx)` hook, in registry order, may return
// `{ rows }` to replace it with display items: server mode's rows, group headers and `undefined`
// holes for rows not loaded yet; client grouping's group headers; tree rows with a depth;
// expanded detail rows after their row; and last the current page. A TanStack row is a data item
// as it is; other items carry `kind` ('row' for wrapped data rows, 'group', 'detail') and `key`
// (wrapped rows: `id` and `original`). A hook returns null when it has nothing to change.
//
// A hook may also return:
// - `dataRows`: the view's data rows in display order when the list leaves some out (rows in
//   collapsed groups, other pages). The first hook's wins (it saw the most); export and the
//   summary read `api.dataRows`. By default it is the list's data items.
// - `rowHeights(item, index)`: the height estimate of items that are not one row high (a detail
//   row before it is measured), or undefined. The window then positions items by offsets built
//   from measured heights and these estimates (virtualization's useRowOffsets).
function useFeatureItems(ctx) {
  let rows = ctx.rows;
  let dataRows = null;
  const heightFns = [];
  ctx.api.features.list.forEach((feature) => {
    if (!feature.useItems) return;
    const result = feature.useItems({ ...ctx, rows });
    if (!result) return;
    if (!dataRows && result.dataRows) dataRows = result.dataRows;
    rows = result.rows;
    if (result.rowHeights) heightFns.push(result.rowHeights);
  });
  const listDataRows = useMemo(
    () => (rows === ctx.rows ? rows : rows.filter(isDataItem)),
    [rows, ctx.rows]
  );
  // Memoised by hand: the number of height functions changes with config.
  const memo = useRef({ heightFns: [], rowHeights: null });
  const same =
    heightFns.length === memo.current.heightFns.length &&
    heightFns.every((fn, index) => fn === memo.current.heightFns[index]);
  if (!same) memo.current = { heightFns, rowHeights: combineHeights(heightFns) };
  return { dataRows: dataRows ?? listDataRows, rowHeights: memo.current.rowHeights, rows };
}

export default useFeatureItems;
