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
import shiftRowOffsets from './shiftRowOffsets.js';

// The one row height mechanism (D10.1). Every display item is one row high unless it is measured:
// data rows when a visible column wraps or clamps to more than one line (`measuredColumns`), and
// items a `useItems` hook gives a height estimate for (`rowHeights`: expandable detail rows).
// Measured elements carry `data-measure-key` and report their rendered height after each window
// render (`measureRows`, called by the body; a detail row also reports when its content resizes).
// Heights are cached by that key; an item not measured yet takes its estimate or the row height.
// Items that grew above the viewport move the scroll position by the same amount, so the rows in
// view stay put. A layout change (column widths, order, visibility) re-wraps text, so it drops
// the cache. Null offsets mean every item is one row high (index * rowHeight).
//
// The offsets are computed in full only when the list, the row height or the layout change. A
// measurement shifts them from the first changed item on (shiftRowOffsets): scrolling into rows
// that were never measured costs one pass of additions, not a height lookup per item. The
// measurements reported before the next render go into one copy, so a render sees one new array.
function useRowOffsets({ api, layout, measuredColumns, rowHeight, rowHeights, rows, scrollerRef }) {
  const enabled = measuredColumns || rowHeights !== null;
  const heightsRef = useRef(new Map());
  const layoutRef = useRef(layout);
  const [, setVersion] = useState(0);
  if (layoutRef.current !== layout) {
    layoutRef.current = layout;
    heightsRef.current = new Map();
  }
  const computed = useMemo(() => {
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
  }, [enabled, rows, rowHeight, rowHeights, layout]);
  // `base` is the full computation the measured offsets shifted; a new one replaces them (it
  // already holds every measured height). `rendered`: a render has handed `offsets` out, so the
  // next measurement shifts a copy.
  const workingRef = useRef({ base: null, offsets: null, rendered: false });
  if (workingRef.current.base !== computed) {
    workingRef.current = { base: computed, offsets: computed, rendered: false };
  }
  workingRef.current.rendered = true;
  const offsets = workingRef.current.offsets;
  api.rowOffsets = offsets;

  const measureRows = useCallback((elements) => {
    const working = workingRef.current;
    const scroller = scrollerRef.current;
    if (!working.offsets || !scroller) return;
    const current = working.offsets;
    const heights = heightsRef.current;
    const scrollTop = scroller.scrollTop;
    const changes = [];
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
      changes.push({ index, delta: height - previous });
      if (current[index + 1] <= scrollTop) shift += height - previous;
    }
    if (changes.length === 0) return;
    if (shift !== 0) scroller.scrollTop = scrollTop + shift;
    const next = working.rendered ? current.slice() : current;
    shiftRowOffsets({ offsets: next, changes });
    workingRef.current = { base: working.base, offsets: next, rendered: false };
    setVersion((value) => value + 1);
  }, []);
  api.measureRows = enabled ? measureRows : null;

  return { measureRows: api.measureRows, rowOffsets: offsets };
}

export default useRowOffsets;
