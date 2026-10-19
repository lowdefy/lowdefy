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

/**
 * The scroll offset that brings a chip fully into a horizontal strip's view, `margin` points
 * clear of each edge, scrolling as little as it can; null when the chip is in view already.
 *
 * @param {Object} params
 * @param {{ x: number, width: number }} params.chip The chip's frame in the strip's content.
 * @param {number} params.contentWidth The width of the strip's content.
 * @param {number} params.margin The space to keep between the chip and the strip's edge.
 * @param {number} params.offset The strip's scroll offset.
 * @param {number} params.viewportWidth The width of the strip's view.
 * @returns {number|null}
 */
function getScrollTarget({ chip, contentWidth, margin, offset, viewportWidth }) {
  const maxOffset = Math.max(0, contentWidth - viewportWidth);
  let target = offset;
  if (chip.x + chip.width + margin > offset + viewportWidth) {
    target = chip.x + chip.width + margin - viewportWidth;
  }
  if (chip.x - margin < target) {
    target = chip.x - margin;
  }
  target = Math.min(Math.max(target, 0), maxOffset);
  if (Math.abs(target - offset) < 0.5) {
    return null;
  }
  return target;
}

export default getScrollTarget;
