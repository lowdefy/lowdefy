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

import React, { useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@lowdefy/client-native';

import useShimmer from './useShimmer.js';

/**
 * A loading placeholder shape: the tertiary system fill with a band of light sweeping across it.
 * The Skeleton block and a loading Card draw it.
 *
 * @param {Object} props
 * @param {Object} [props.style] The shape's size, corner radius and margins.
 * @param {string} [props.testID]
 */
function SkeletonShape({ style, testID }) {
  const { isDark, tokens } = useTheme();
  const progress = useShimmer();
  const [width, setWidth] = useState(0);
  const highlight = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.65)';
  return (
    <View
      accessible
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        { backgroundColor: tokens.colorTertiarySystemFill, borderRadius: 4 },
        style,
        { overflow: 'hidden' },
      ]}
      testID={testID}
    >
      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-width, width],
                  }),
                },
              ],
            },
          ]}
        >
          <Svg height="100%" width="100%">
            <Defs>
              <LinearGradient id="shimmer" x1="0" x2="1" y1="0" y2="0">
                <Stop offset="0" stopColor={highlight} stopOpacity="0" />
                <Stop offset="0.5" stopColor={highlight} stopOpacity="1" />
                <Stop offset="1" stopColor={highlight} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect fill="url(#shimmer)" height="100%" width="100%" />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

export default SkeletonShape;
