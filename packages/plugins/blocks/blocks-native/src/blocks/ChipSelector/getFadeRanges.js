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
 * The scroll offsets over which a horizontal strip's edge fades show: the leading fade grows in
 * over the first `fadeWidth` points scrolled, the trailing one fades out over the last. Each is
 * an Animated interpolation of the offset to an opacity. Null when the content fits the view, so
 * there is nothing to fade.
 *
 * @param {Object} params
 * @param {number} params.contentWidth The width of the strip's content.
 * @param {number} params.fadeWidth The width of a fade.
 * @param {number} params.viewportWidth The width of the strip's view.
 * @returns {{ start: Object, end: Object }|null} `{ inputRange, outputRange }` for each edge.
 */
function getFadeRanges({ contentWidth, fadeWidth, viewportWidth }) {
  const maxOffset = contentWidth - viewportWidth;
  if (viewportWidth <= 0 || maxOffset < 1) {
    return null;
  }
  const span = Math.min(fadeWidth, maxOffset);
  return {
    start: { inputRange: [0, span], outputRange: [0, 1] },
    end: { inputRange: [maxOffset - span, maxOffset], outputRange: [1, 0] },
  };
}

export default getFadeRanges;
