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

import childStyle from './childStyle.js';
import containerStyle from './containerStyle.js';
import withoutUndefined from './withoutUndefined.js';

/**
 * The React Native styles of v7's layout grid (grid.css) for one layout.
 *
 * @param {Object} [layout] An evaluated layout: a slot's settings for `container`, a block's
 *   layout for `child`.
 * @param {string} [breakpoint] The current breakpoint (getBreakpoint).
 * @param {number} [parentColumnGap] The column gap of the area a block placed by `child` is in.
 * @returns {{ container: Object, child: Object, columnGap: number }} `container` styles an area
 *   laid out by `layout`, `columnGap` is the column gap that area's blocks are placed with, and
 *   `child` places a block by `layout`.
 */
function layoutStyles(layout = {}, breakpoint = 'xs', parentColumnGap = 0) {
  const container = containerStyle({ breakpoint, layout });
  return {
    container: withoutUndefined(container.style),
    child: withoutUndefined(childStyle({ breakpoint, columnGap: parentColumnGap, layout })),
    columnGap: container.columnGap,
  };
}

export default layoutStyles;
