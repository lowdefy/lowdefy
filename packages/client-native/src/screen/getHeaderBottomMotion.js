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

import { Animated } from 'react-native';

// The scroll distance over which the pinned strip's surface and hairline fade in.
const FADE_DISTANCE = 6;

/**
 * How a Screen's headerBottom moves with the page: `translateY`, the distance the page's top has
 * scrolled past the navigation bar's bottom edge (0 while it is at or below the bar, so the strip
 * rides with the content as a large title collapses or the page is pulled to refresh), and
 * `pinnedOpacity`, which fades the strip's surface and hairline in over the first 6pt pinned,
 * and `tintOffset`, where the top of the page's scroll view is in the strip's surface, so the
 * surface draws the page's backgroundTint where the page draws it, with no seam.
 *
 * @param {Object} params
 * @param {number} params.cover How far the strip's surface reaches above the strip.
 * @param {Object|number} params.headerInset Where the bar's bottom edge is in the page scroll
 *   view's frame.
 * @param {Object|number} params.scrollY The page scroll view's vertical offset.
 * @returns {{ pinnedOpacity: Object, tintOffset: Object, translateY: Object }} Animated values.
 */
function getHeaderBottomMotion({ cover, headerInset, scrollY }) {
  const scrolledPast = Animated.add(scrollY, headerInset);
  const translateY = scrolledPast.interpolate({
    extrapolateLeft: 'clamp',
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  return {
    pinnedOpacity: scrolledPast.interpolate({
      extrapolate: 'clamp',
      inputRange: [0, FADE_DISTANCE],
      outputRange: [0, 1],
    }),
    // The strip's top is at `translateY - scrollY` in the scroll view's frame, and its surface's
    // top `cover` above that: the scroll view's top is `cover + scrollY - translateY` down the
    // surface, wherever the strip is.
    tintOffset: Animated.subtract(Animated.add(cover, scrollY), translateY),
    translateY,
  };
}

export default getHeaderBottomMotion;
