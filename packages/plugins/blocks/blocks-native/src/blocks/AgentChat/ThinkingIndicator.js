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
import { Animated, StyleSheet, Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';

const DOT = 7;

function useDots() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(
        160,
        dots.map((dot) =>
          Animated.sequence([
            Animated.timing(dot, { duration: 320, toValue: 1, useNativeDriver: true }),
            Animated.timing(dot, { duration: 320, toValue: 0.3, useNativeDriver: true }),
          ])
        )
      )
    );
    loop.start();
    return () => loop.stop();
  }, [dots]);
  return dots;
}

/**
 * The agent is working and nothing of its reply shows yet: three pulsing dots, and after a
 * moment the thinking message (useThinkingMessage), announced to screen readers as it changes.
 *
 * @param {Object} props
 * @param {Object} props.colors
 * @param {string|null} props.label
 * @param {string} props.testID
 */
function ThinkingIndicator({ colors, label, testID }) {
  const dots = useDots();
  return (
    <View
      accessibilityLabel={label ?? undefined}
      accessibilityLiveRegion="polite"
      style={styles.row}
      testID={testID}
    >
      <View style={styles.dots}>
        {dots.map((opacity, index) => (
          <Animated.View
            key={index}
            style={[styles.dot, { backgroundColor: colors.secondary, opacity }]}
          />
        ))}
      </View>
      {type.isString(label) && label !== '' ? (
        <Text style={[styles.label, { color: colors.secondary }]}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 24, paddingVertical: 4 },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { borderRadius: DOT / 2, height: DOT, width: DOT },
  label: { fontSize: 15, letterSpacing: -0.24, lineHeight: 20 },
});

export default ThinkingIndicator;
