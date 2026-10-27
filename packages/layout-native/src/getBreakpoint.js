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

import breakpoints from './breakpoints.js';

// Android's tablet threshold (sw600dp): a window whose shorter side is at least this wide is a
// tablet, or an unfolded foldable.
const TABLET_SHORTER_SIDE = 600;

/**
 * The layout breakpoint of a native window. A phone uses its shorter side, so turning it to
 * landscape keeps its portrait layout instead of showing web columns. A tablet uses its width.
 *
 * @param {Object} params
 * @param {number} params.width The window width in points.
 * @param {number} params.height The window height in points.
 * @returns {string} 'xs', 'sm', 'md', 'lg', 'xl' or '2xl'.
 */
function getBreakpoint({ width, height }) {
  const shorterSide = Math.min(width, height);
  const size = shorterSide >= TABLET_SHORTER_SIDE ? width : shorterSide;
  let breakpoint = breakpoints[0].name;
  breakpoints.forEach(({ name, minWidth }) => {
    if (size >= minWidth) {
      breakpoint = name;
    }
  });
  return breakpoint;
}

export default getBreakpoint;
