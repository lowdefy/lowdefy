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

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useTheme } from '@lowdefy/client-native';

import meta from './meta.js';
import resolveColor from '../../shared/resolveColor.js';

// iOS's page control: 7pt dots, 9pt apart, the other pages' dots faint.
const DOT = 7;
const GAP = 9;
const STEP = DOT + GAP;
const INACTIVE_OPACITY = 0.3;
const PADDING = 4;

// The active dot slides to its page on a spring, stretching across as it leaves and settling
// round as it lands. Both run on the native driver.
function useActiveDotMotion(index) {
  const position = useRef(new Animated.Value(index * STEP)).current;
  const stretch = useRef(new Animated.Value(1)).current;
  const shown = useRef(index);
  useEffect(() => {
    if (shown.current === index) return;
    shown.current = index;
    Animated.parallel([
      Animated.spring(position, {
        bounciness: 6,
        speed: 14,
        toValue: index * STEP,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(stretch, {
          duration: 90,
          easing: Easing.out(Easing.quad),
          toValue: 1.7,
          useNativeDriver: true,
        }),
        Animated.spring(stretch, { bounciness: 8, speed: 16, toValue: 1, useNativeDriver: true }),
      ]),
    ]).start();
  }, [index, position, stretch]);
  return { position, stretch };
}

/**
 * A row of page dots, as iOS's page control: where the page shown is among `count`, such as a
 * record among recents swiped through. The active dot is drawn in `color` and slides to its
 * page when `index` changes; the others are drawn in it at 30%.
 */
function PageDots({ blockId, properties, styles = {} }) {
  const { tokens } = useTheme();
  const count = properties.count ?? 0;
  const index = Math.min(Math.max(properties.index ?? 0, 0), Math.max(count - 1, 0));
  const color = resolveColor({ color: properties.color ?? 'colorLabel', tokens });
  const motion = useActiveDotMotion(index);
  if (count === 0) {
    return null;
  }
  const dot = { backgroundColor: color, borderRadius: DOT / 2, height: DOT, width: DOT };
  return (
    <View
      accessible
      accessibilityLabel={`Page ${index + 1} of ${count}`}
      style={[
        { alignSelf: 'center', columnGap: GAP, flexDirection: 'row', paddingVertical: PADDING },
        styles.element,
      ]}
    >
      {Array.from({ length: count }, (_, page) => (
        <View key={page} style={[dot, { opacity: INACTIVE_OPACITY }]} />
      ))}
      <Animated.View
        style={[
          dot,
          {
            left: 0,
            position: 'absolute',
            top: PADDING,
            transform: [{ translateX: motion.position }, { scaleX: motion.stretch }],
          },
        ]}
        testID={`${blockId}_active`}
      />
    </View>
  );
}

PageDots.meta = meta;

export default PageDots;
