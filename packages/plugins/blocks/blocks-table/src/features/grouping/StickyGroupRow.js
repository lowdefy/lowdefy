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

import React, { useEffect, useReducer, useRef } from 'react';
import { flushSync } from 'react-dom';

import getStickyGroup from './getStickyGroup.js';
import GroupRow from './GroupRow.js';

function bump(count) {
  return count + 1;
}

function measure({ api, headerHeight, sticky }) {
  const scroller = api.scrollerRef.current;
  if (!api.grouping || !scroller) return { index: -1, shift: 0 };
  // Body offset of the first row under the header: with a sticky header the body starts where
  // the header sits; a non-sticky header scrolls away first.
  const scrollTop = sticky ? scroller.scrollTop : scroller.scrollTop - headerHeight;
  return getStickyGroup({
    groupIndices: api.grouping.groupIndices,
    rowHeight: api.rowHeight,
    scrollTop,
  });
}

// The one sticky group header (D10.8): a copy of the group header the top rows belong to,
// overlaid under the column header, instead of a sticky element per group. It renders only when
// that group changes; the push-up as the next header arrives is a transform written on scroll.
function StickyGroupRow({
  api,
  centerCols,
  headerHeight,
  layout,
  rowClassName,
  rows,
  selectable,
  selection,
  sticky,
}) {
  const [, forceRender] = useReducer(bump, 0);
  const shiftRef = useRef(null);
  const renderedIndex = useRef(-1);
  const args = useRef(null);
  args.current = { api, headerHeight, sticky };

  useEffect(() => {
    const element = api.scrollerRef.current;
    let frame = 0;
    function onFrame() {
      frame = 0;
      const next = measure(args.current);
      if (next.index !== renderedIndex.current) {
        flushSync(forceRender);
        return;
      }
      if (shiftRef.current) shiftRef.current.style.transform = `translateY(${next.shift}px)`;
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(onFrame);
    }
    element.addEventListener('scroll', schedule, { passive: true });
    return () => {
      element.removeEventListener('scroll', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Read in render so the overlay always matches the rows it is rendered with (a collapse changes
  // which list index is the current group without any scroll).
  const current = measure(args.current);
  renderedIndex.current = current.index;
  if (current.index < 0) return null;
  // tabIndex: a click on the overlay focuses it rather than the scroller, whose focus handler
  // would scroll back to the active cell before the click lands.
  return (
    <div
      aria-hidden="true"
      className="lf-table-group-sticky"
      data-lf-group-sticky=""
      style={{ top: sticky ? headerHeight : 0 }}
      tabIndex={-1}
    >
      <div
        className="lf-table-group-sticky-shift"
        ref={shiftRef}
        style={{ transform: `translateY(${current.shift}px)` }}
      >
        <GroupRow
          activeCol={-1}
          api={api}
          centerCols={centerCols}
          className={rowClassName}
          displayIndex={current.index}
          endCols={layout.end}
          item={rows[current.index]}
          overlay
          selectable={selectable}
          selection={selection}
          startCols={layout.start}
        />
      </div>
    </div>
  );
}

export default StickyGroupRow;
