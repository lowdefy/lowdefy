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

import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import { flushSync } from 'react-dom';

import buildStickyLevels from './buildStickyLevels.js';
import getStickyGroups from './getStickyGroups.js';
import GroupRow from './GroupRow.js';

function bump(count) {
  return count + 1;
}

function measure({ api, headerHeight, levels, sticky }) {
  const scroller = api.scrollerRef.current;
  if (!api.grouping || !scroller) return [];
  // Body offset of the first row under the header: with a sticky header the body starts where
  // the header sits; a non-sticky header scrolls away first.
  const scrollTop = sticky ? scroller.scrollTop : scroller.scrollTop - headerHeight;
  return getStickyGroups({
    levels,
    rowHeight: api.rowHeight,
    rowOffsets: api.rowOffsets,
    scrollTop,
  });
}

function sameIndices(groups, indices) {
  if (groups.length !== indices.length) return false;
  return groups.every((group, level) => group.index === indices[level]);
}

// The sticky group headers (D10.8): one overlay under the column header holding a copy of the
// current group header of each level, stacked outermost first (EMEA, then its rep), instead of
// a sticky element per group. It renders only when a level's group changes; the push-ups as the
// next headers arrive are transforms written on scroll. Inner levels sit under outer ones, so a
// new outer group pushes them out first.
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
  const shiftRefs = useRef([]);
  const renderedIndices = useRef([]);
  // Null while the table is not grouped (the overlay then renders nothing).
  const { grouping } = api;
  const groupIndices = grouping?.groupIndices;
  const levelCount = grouping?.levels.length ?? 0;
  const levels = useMemo(
    () => (grouping ? buildStickyLevels({ groupIndices, levelCount, rows }) : []),
    [groupIndices, levelCount, rows]
  );
  const args = useRef(null);
  args.current = { api, headerHeight, levels, sticky };

  useEffect(() => {
    const element = api.scrollerRef.current;
    let frame = 0;
    function onFrame() {
      frame = 0;
      const next = measure(args.current);
      if (!sameIndices(next, renderedIndices.current)) {
        flushSync(forceRender);
        return;
      }
      next.forEach((group, level) => {
        const shift = shiftRefs.current[level];
        if (shift) shift.style.transform = `translateY(${group.shift}px)`;
      });
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
  const groups = measure(args.current);
  renderedIndices.current = groups.map((group) => group.index);
  if (groups.length === 0) return null;
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
      {groups.map((group, level) => (
        <div
          className="lf-table-group-sticky-shift"
          data-group-level={level}
          key={level}
          ref={(element) => {
            shiftRefs.current[level] = element;
          }}
          style={{
            top: level * api.rowHeight,
            transform: `translateY(${group.shift}px)`,
            zIndex: groups.length - level,
          }}
        >
          <GroupRow
            activeCol={-1}
            api={api}
            centerCols={centerCols}
            className={rowClassName}
            displayIndex={group.index}
            endCols={layout.end}
            item={rows[group.index]}
            overlay
            selectable={selectable}
            selection={selection}
            startCols={layout.start}
          />
        </div>
      ))}
    </div>
  );
}

export default StickyGroupRow;
