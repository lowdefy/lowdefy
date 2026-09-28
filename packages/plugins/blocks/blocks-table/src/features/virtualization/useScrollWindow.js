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

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import computeWindow from './computeWindow.js';
import isSameRange from './isSameRange.js';

// Native scroll, observed passively and coalesced into one rAF; React renders only when the
// rendered range changes (D10.2). The render is flushed inside that frame so new rows paint with
// the scroll position that needed them. The scroll offset itself never enters React state.
function useScrollWindow({ scrollerRef, params }) {
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const scrollRef = useRef({ top: 0, direction: 0 });
  const [range, setRange] = useState(() =>
    computeWindow({
      ...params,
      direction: 0,
      scrollLeft: 0,
      scrollTop: 0,
      viewportHeight: params.rowHeight * 20,
      viewportWidth: 1200,
    })
  );

  const update = useCallback((sync) => {
    const element = scrollerRef.current;
    if (!element) return;
    const scroll = scrollRef.current;
    const top = element.scrollTop;
    if (top !== scroll.top) scroll.direction = top > scroll.top ? 1 : -1;
    scroll.top = top;
    const next = computeWindow({
      ...paramsRef.current,
      direction: scroll.direction,
      scrollLeft: element.scrollLeft,
      scrollTop: top,
      viewportHeight: element.clientHeight,
      viewportWidth: element.clientWidth,
    });
    const apply = () => setRange((previous) => (isSameRange(previous, next) ? previous : next));
    if (sync) {
      flushSync(apply);
    } else {
      apply();
    }
  }, []);

  useLayoutEffect(() => {
    update(false);
  }, [
    params.headerHeight,
    params.layout,
    params.rowCount,
    params.rowHeight,
    params.rowOffsets,
    params.virtualColumns,
    params.virtualRows,
  ]);

  useEffect(() => {
    const element = scrollerRef.current;
    let frame = 0;
    function onFrame() {
      frame = 0;
      update(true);
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(onFrame);
    }
    element.addEventListener('scroll', schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    return () => {
      element.removeEventListener('scroll', schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // The range state catches up with a new row count in the layout effect above; for the one
  // render before it does (rows filtered away, groups collapsed), it must not reach past the rows.
  if (range.rowEnd <= params.rowCount) return range;
  return { ...range, rowStart: Math.min(range.rowStart, params.rowCount), rowEnd: params.rowCount };
}

export default useScrollWindow;
