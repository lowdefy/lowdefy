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

function isRow(flexDirection) {
  return flexDirection === 'row' || flexDirection === 'row-reverse';
}

/**
 * Whether a block's placement in a gapped area is taller than its content, so the view inside it
 * that carries the block's style must grow to fill it (as the web's column div, which carries the
 * style, is stretched or grown itself). In a row, the area stretches the placement to its line's
 * height unless the area or the block aligns it otherwise; in a column, the placement grows only
 * when the block's flex grows it.
 *
 * Only then: React Native's Yoga (errata StretchFlexBasis) grows a flexGrow child to the height it
 * is measured within, not to its content. A placement aligned in a wrapping row is measured within
 * the area's height, so a growing inner view took the height of the whole area on every line, and
 * the lines after the first drew below the area, over the blocks after it.
 *
 * @param {Object} params
 * @param {Object} params.container The area's container style (layoutStyles `container`).
 * @param {Object} params.child The block's placement style (layoutStyles `child`).
 * @returns {boolean}
 */
function fillsPlacement({ container = {}, child = {} }) {
  if (isRow(container.flexDirection)) {
    const align = child.alignSelf ?? container.alignItems ?? 'stretch';
    return align === 'stretch';
  }
  return (child.flexGrow ?? child.flex ?? 0) > 0;
}

export default fillsPlacement;
