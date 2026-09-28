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

// Measured row heights (D10.1), used when a visible column wraps or clamps to more than one line.
// Heights are cached by row key and start from the density row height; rows report their
// rendered height after each window render (`measureRows`), and rows that grew above the viewport
// move the scroll position by the same amount, so the rows in view stay put. A layout change
// (column widths, order, visibility) re-wraps text, so it drops the cache.
function useMeasuredRows({ api, enabled, layout, rowHeight, rows, scrollerRef }) {
  const heightsRef = useRef(new Map());
  const layoutRef = useRef(layout);
  const [version, setVersion] = useState(0);
  if (layoutRef.current !== layout) {
    layoutRef.current = layout;
    heightsRef.current = new Map();
  }
  const offsets = useMemo(
    () => (enabled ? computeRowOffsets({ rows, rowHeight, heights: heightsRef.current }) : null),
    [enabled, rows, rowHeight, layout, version]
  );
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
      const index = Number(element.dataset.rowIndex);
      const height = element.offsetHeight;
      const previous = current[index + 1] - current[index];
      if (height === previous) continue;
      heights.set(element.dataset.rowKey, height);
      changed = true;
      if (current[index + 1] <= scrollTop) shift += height - previous;
    }
    if (!changed) return;
    if (shift !== 0) scroller.scrollTop = scrollTop + shift;
    setVersion((value) => value + 1);
  }, []);

  return { measureRows: enabled ? measureRows : null, rowOffsets: offsets };
}

export default useMeasuredRows;
