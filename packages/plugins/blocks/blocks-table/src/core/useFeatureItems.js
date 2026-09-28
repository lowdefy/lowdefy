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

import { useRef } from 'react';

import computeRowOffsets from './computeRowOffsets.js';
import features from '../features/index.js';

// The flat list the body windows over. It starts as TanStack's row model rows; a feature's
// `useItems(ctx)` hook may replace it in registry order with display items: tree rows with a
// depth, server group headers, expanded detail rows, and `undefined` holes for server rows that
// are not loaded yet (skeleton rows). A TanStack row is a row item as it is; wrapped items carry
// `kind` ('row' | 'group' | 'detail' | ...), `id` and, for rows, `original`.
//
// A hook may also return `rowHeights(item, index)` for items that are not one row high (a
// measured detail row); the body then positions items by the offsets built from them.
function useFeatureItems(ctx) {
  let rows = ctx.rows;
  const heightFns = [];
  features.forEach((feature) => {
    if (!feature.useItems) return;
    const result = feature.useItems({ ...ctx, rows });
    if (!result) return;
    rows = result.rows;
    if (result.rowHeights) heightFns.push(result.rowHeights);
  });
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
  return { rows, rowOffsets: memo.current.rowOffsets };
}

export default useFeatureItems;
