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

const COLUMNS = 24;

// deriveLayout's resolveSpan: an offset with no span takes the rest of the row.
function resolveSpan(span, offset) {
  if (span !== undefined && span !== null) return span;
  return offset ? COLUMNS - offset : COLUMNS;
}

/*
  layout.offset is a cumulative flex margin, not a grid line: grid.css gives
  .lf-col `margin-inline-start: offset/24 * (100% + gap)`, so a child starts
  wherever the children before it left off, plus its own offset. A CSS grid
  places a child on an absolute line, so the offsets have to be accumulated
  into a col-start.

  The accumulation runs a 24-column cursor across the siblings. A child starts
  at `cursor + offset` and advances the cursor by `offset + span`. When a child
  no longer fits in the remaining columns the flex row wraps, so the cursor is
  reset and the child starts at its own offset on the next row.

  The limit: after an overflow, an explicit col-start places the child on that
  grid line of the next row, while flex wrap simply pushed it to the left edge
  plus its margin. The two agree only while every wrapped row's offsets are the
  same as they were on the first row. Every overflowing run is reported so the
  author checks the wrap points, and a child whose own offset + span exceeds 24
  cannot be placed at all and is left untouched.
*/
function spanRunToClasses(items) {
  let cursor = 0;
  let overflowed = false;

  const placements = items.map((item) => {
    const offset = item.offset ?? 0;
    const span = resolveSpan(item.span, item.offset);

    if (offset + span > COLUMNS) {
      return { classes: [], unplaceable: true, wrapped: false };
    }

    let start = cursor + offset;
    let wrapped = false;
    if (start + span > COLUMNS) {
      start = offset;
      wrapped = true;
      overflowed = true;
    }
    cursor = start + span;

    // Grid auto-placement already continues from the previous cell, so a
    // col-start is only needed where an offset moves the child off that line.
    const classes = [`col-span-${span}`];
    if (offset > 0) classes.push(`col-start-${start + 1}`);
    return { classes, unplaceable: false, wrapped };
  });

  return { placements, overflowed };
}

export default spanRunToClasses;
