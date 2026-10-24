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

import React, { useContext, useRef, useState } from 'react';
import { Animated, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useReduceMotion, useTheme } from '@lowdefy/client-native';

import SkeletonFrameContext from './SkeletonFrameContext.js';
import useShimmer from './useShimmer.js';

// The band is most of the screen wide and eases in and out (BAND_STOPS), so it reads as a soft
// sheen passing rather than a stripe.
const BAND_SHARE = 0.75;
const BAND_STOPS = [
  { offset: '0', opacity: '0' },
  { offset: '0.25', opacity: '0.35' },
  { offset: '0.5', opacity: '1' },
  { offset: '0.75', opacity: '0.35' },
  { offset: '1', opacity: '0' },
];

/**
 * A loading placeholder shape: the skeleton fill (colorSkeleton) with a soft band of light
 * (colorSkeletonHighlight) sweeping left to right across it. Every shape reads one clock
 * (useShimmer) and places the band by its x in its Skeleton block (SkeletonFrameContext), so all
 * the shapes on a screen sweep together, as one band crossing the screen. With Reduce Motion on
 * the shape is the plain fill.
 *
 * @param {Object} props
 * @param {boolean} [props.busy] Announce the shape as a loading progress bar, when it is the
 *   whole placeholder.
 * @param {Object} [props.style] The shape's size, corner radius and margins.
 * @param {string} [props.testID]
 */
function SkeletonShape({ busy = false, style, testID }) {
  const { tokens } = useTheme();
  const frame = useContext(SkeletonFrameContext);
  const reduceMotion = useReduceMotion();
  const progress = useShimmer({ enabled: !reduceMotion });
  const { width: screenWidth } = useWindowDimensions();
  const ref = useRef(null);
  const [offset, setOffset] = useState(frame === null ? 0 : null);
  const band = Math.round(screenWidth * BAND_SHARE);

  function onLayout() {
    if (frame === null) return;
    ref.current.measureLayout(frame.current, (x) => setOffset(x));
  }

  const accessibility = busy
    ? {
        accessible: true,
        accessibilityLabel: 'Loading',
        accessibilityRole: 'progressbar',
        accessibilityState: { busy: true },
      }
    : {};
  return (
    <View
      {...accessibility}
      onLayout={onLayout}
      ref={ref}
      style={[
        { backgroundColor: tokens.colorSkeleton, borderRadius: 4 },
        style,
        { overflow: 'hidden' },
      ]}
      testID={testID}
    >
      {reduceMotion || offset === null ? null : (
        <Animated.View
          pointerEvents="none"
          style={{
            bottom: 0,
            left: 0,
            position: 'absolute',
            top: 0,
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-band - offset, screenWidth - offset],
                }),
              },
            ],
            width: band,
          }}
          testID={testID ? `${testID}_shimmer` : undefined}
        >
          <Svg height="100%" width="100%">
            <Defs>
              <LinearGradient id="shimmer" x1="0" x2="1" y1="0" y2="0">
                {BAND_STOPS.map((stop) => (
                  <Stop
                    key={stop.offset}
                    offset={stop.offset}
                    stopColor={tokens.colorSkeletonHighlight}
                    stopOpacity={stop.opacity}
                  />
                ))}
              </LinearGradient>
            </Defs>
            <Rect fill="url(#shimmer)" height="100%" width="100%" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

export default SkeletonShape;
