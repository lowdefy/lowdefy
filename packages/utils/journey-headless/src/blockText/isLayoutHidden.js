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

import { type } from '@lowdefy/helpers';

import { RUNNER_WIDTH } from './readClassToken.js';

// The widths from which @lowdefy/layout's grid css applies each breakpoint's display, widest
// first (grid.css's media queries, which an app's theme does not change).
const LAYOUT_BREAKPOINTS = [
  ['2xl', 1536],
  ['xl', 1280],
  ['lg', 1024],
  ['md', 768],
  ['sm', 640],
];

function resolveSpan({ span, offset }) {
  if (type.isNone(span)) return offset ? 24 - offset : 24;
  return span;
}

// Whether a block's layout hides its wrapper at the browser runner's width: as @lowdefy/layout's
// deriveLayout sets --lf-display (none for a span of 0) for the base, sm, md, lg, xl and 2xl, and
// its grid css reads the one for the widest breakpoint the width reaches that has one, else the
// narrower ones, else block. A disabled layout or a flex one sets no display.
function isLayoutHidden({ layout }) {
  if (!type.isObject(layout) || layout.disabled) return false;
  const { flex, grow, shrink, size } = layout;
  if ([flex, grow, shrink, size].some((value) => !type.isNone(value))) return false;
  const display = {};
  const read = (settings) => (resolveSpan(settings) === 0 ? 'none' : 'block');
  if (resolveSpan(layout) === 0) display.md = 'none';
  if (type.isObject(layout.sm)) {
    display.base = read(layout.sm);
    display.sm = read(layout.sm);
  }
  if (type.isObject(layout.xs)) display.base = read(layout.xs);
  if (type.isObject(layout.md)) display.md = read({ offset: layout.offset, ...layout.md });
  ['lg', 'xl', '2xl'].forEach((breakpoint) => {
    if (type.isObject(layout[breakpoint])) display[breakpoint] = read(layout[breakpoint]);
  });
  const applied = LAYOUT_BREAKPOINTS.filter(([, width]) => RUNNER_WIDTH >= width)
    .map(([breakpoint]) => display[breakpoint])
    .find((value) => !type.isUndefined(value));
  return (applied ?? display.base) === 'none';
}

export default isLayoutHidden;
