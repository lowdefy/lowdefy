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

import React, { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import EdgeInsetContext from '../layout/EdgeInsetContext.js';
import getHeaderBottomMotion from './getHeaderBottomMotion.js';
import useTheme from '../theme/useTheme.js';

// The screen inset its blocks sit at, which an edge-to-edge block cancels (EdgeInsetContext).
const INSET = 16;
// How far the surface reaches above the strip once it is pinned: over the header, which on iOS
// is clear glass the page scrolls under, so content that scrolls past the strip stays hidden.
const COVER = 1000;

/**
 * A Screen's headerBottom: blocks pinned directly under the navigation bar (under the large title
 * or the search field), which stay in view as the page scrolls. It is the page's first content,
 * moved down by the distance the page has scrolled past the bar's bottom edge, so it rides with
 * the content while a large title collapses, and with a pull-to-refresh, and is pinned once the
 * bar is compact. Pinned, it takes the screen's background over the bar too, and a hairline under
 * it. Both move on the native driver, with the page's scroll offset.
 *
 * @param {Object} props
 * @param {string} props.blockId The Screen's block id.
 * @param {React.ReactNode} props.children The slot's blocks.
 * @param {Object|number} props.headerInset Where the bar's bottom edge is, in the page scroll
 *   view's frame (an Animated value as a large title collapses, or 0 when the page sits below
 *   the bar).
 * @param {Object} props.scrollY The page scroll view's Animated vertical offset.
 */
function HeaderBottom({ blockId, children, headerInset, scrollY }) {
  const { tokens } = useTheme();
  const motion = useMemo(
    () => getHeaderBottomMotion({ headerInset, scrollY }),
    [headerInset, scrollY]
  );
  return (
    <Animated.View
      style={{ transform: [{ translateY: motion.translateY }], zIndex: 1 }}
      testID={`${blockId}_header_bottom`}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          backgroundColor: tokens.colorGroupedBackground,
          bottom: 0,
          left: 0,
          opacity: motion.pinnedOpacity,
          position: 'absolute',
          right: 0,
          top: -COVER,
        }}
      />
      <EdgeInsetContext.Provider value={INSET}>
        <View style={{ paddingHorizontal: INSET, paddingVertical: 8 }}>{children}</View>
      </EdgeInsetContext.Provider>
      <Animated.View
        pointerEvents="none"
        style={{
          backgroundColor: tokens.colorSeparator,
          bottom: 0,
          height: StyleSheet.hairlineWidth,
          left: 0,
          opacity: motion.pinnedOpacity,
          position: 'absolute',
          right: 0,
        }}
        testID={`${blockId}_header_bottom_separator`}
      />
    </Animated.View>
  );
}

export default HeaderBottom;
