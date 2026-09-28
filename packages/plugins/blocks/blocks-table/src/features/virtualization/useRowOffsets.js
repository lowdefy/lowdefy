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

import { useCallback, useMemo, useRef, useState } from 'react';

import computeRowOffsets from './computeRowOffsets.js';
import getMeasureKey from './getMeasureKey.js';

// The one row height mechanism (D10.1). Every display item is one row high unless it is measured:
// data rows when a visible column wraps or clamps to more than one line (`measuredColumns`), and
// items a `useItems` hook gives a height estimate for (`rowHeights`: expandable detail rows).
// Measured elements carry `data-measure-key` and report their rendered height after each window
// render (`measureRows`, called by the body; a detail row also reports when its content resizes).
// Heights are cached by that key; an item not measured yet takes its estimate or the row height.
// Items that grew above the viewport move the scroll position by the same amount, so the rows in
// view stay put. A layout change (column widths, order, visibility) re-wraps text, so it drops
// the cache. Null offsets mean every item is one row high (index * rowHeight).
function useRowOffsets({ api, layout, measuredColumns, rowHeight, rowHeights, rows, scrollerRef }) {
  const enabled = measuredColumns || rowHeights !== null;
  const heightsRef = useRef(new Map());
  const layoutRef = useRef(layout);
  const [version, setVersion] = useState(0);
  if (layoutRef.current !== layout) {
    layoutRef.current = layout;
    heightsRef.current = new Map();
  }
  const offsets = useMemo(() => {
    if (!enabled) return null;
    const heights = heightsRef.current;
    return computeRowOffsets({
      rows,
      rowHeight,
      heightOf: (item, index) => {
        const key = getMeasureKey(item);
        const measured = key === null ? undefined : heights.get(key);
        return measured ?? rowHeights?.(item, index);
      },
    });
  }, [enabled, rows, rowHeight, rowHeights, layout, version]);
  const offsetsRef = useRef(offsets);
  offsetsRef.current = offsets;
  api.rowOffsets = offsets;

  const measureRows = useCallback((elements) => {
    const current = offsetsRef.current;
    const scroller = scrollerRef.current;
    if (!current || !scroller) return;
    const heights = heightsRef.current;
    const scrollTop = scroller.scrollTop;
    let changed = false;
    let shift = 0;
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const key = element.dataset.measureKey;
      if (key === undefined) continue;
      const index = Number(element.dataset.rowIndex);
      const height = element.offsetHeight;
      const previous = current[index + 1] - current[index];
      heights.set(key, height);
      if (height === previous) continue;
      changed = true;
      if (current[index + 1] <= scrollTop) shift += height - previous;
    }
    if (!changed) return;
    if (shift !== 0) scroller.scrollTop = scrollTop + shift;
    setVersion((value) => value + 1);
  }, []);
  api.measureRows = enabled ? measureRows : null;

  return { measureRows: api.measureRows, rowOffsets: offsets };
}

export default useRowOffsets;
