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

import breakpointIndex from './breakpointIndex.js';
import breakpoints from './breakpoints.js';

// One axis of a gap: a number for every breakpoint, or { xs, sm, md, ... } where each value
// applies from its breakpoint up. Rounded to whole points, as the web rounds to whole pixels.
function resolveAxis({ breakpoint, value }) {
  if (type.isNumber(value)) {
    return Math.round(value);
  }
  if (!type.isObject(value)) {
    return 0;
  }
  let resolved = 0;
  breakpoints.slice(0, breakpointIndex(breakpoint) + 1).forEach(({ name }) => {
    if (type.isNumber(value[name])) {
      resolved = Math.round(value[name]);
    }
  });
  return resolved;
}

/**
 * An area's gap at a breakpoint. `gap` is a number for both axes, [x, y], an object per
 * breakpoint, or [x, y] of those.
 *
 * @returns {{ x: number, y: number }} The column (x) and row (y) gaps in points.
 */
function resolveGap({ breakpoint, gap }) {
  if (type.isArray(gap)) {
    return {
      x: resolveAxis({ breakpoint, value: gap[0] }),
      y: resolveAxis({ breakpoint, value: gap[1] }),
    };
  }
  const value = resolveAxis({ breakpoint, value: gap });
  return { x: value, y: value };
}

export default resolveGap;
