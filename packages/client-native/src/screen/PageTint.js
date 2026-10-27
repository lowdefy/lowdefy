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

import React from 'react';
import { Animated } from 'react-native';

import ScreenTint from './ScreenTint.js';

/**
 * A Screen's backgroundTint as the page draws it: the page scroll view's first content, behind the
 * blocks, moved down by the scroll offset so it stays fixed to the screen's top (behind the status
 * bar, the navigation bar, the large title and the search field, which the page scrolls under)
 * as the page scrolls, collapses its large title or is pulled to refresh. It is drawn in the
 * scroll view, not behind it, so the scroll view stays the screen's first view, as the native
 * stack looks for it.
 *
 * @param {Object} props
 * @param {Object} props.scrollY The page scroll view's Animated vertical offset.
 * @param {Object} props.tint The page's tint store (createTintStore).
 */
function PageTint({ scrollY, tint }) {
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        transform: [{ translateY: scrollY }],
      }}
      testID="screen_tint"
    >
      <ScreenTint id="screen_tint" tint={tint} />
    </Animated.View>
  );
}

export default PageTint;
