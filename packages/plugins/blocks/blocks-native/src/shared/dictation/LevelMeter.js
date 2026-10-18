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
import { StyleSheet, View } from 'react-native';

import getLevelBars from './getLevelBars.js';

/**
 * Eight bars that follow the microphone's input level while dictation listens. Screen readers
 * skip it; the listening row's text says what it shows.
 *
 * @param {Object} props
 * @param {string} props.color
 * @param {number} props.level The input level, from 0 to 1.
 * @param {string} [props.testID]
 */
function LevelMeter({ color, level, testID }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.meter}
      testID={testID}
    >
      {getLevelBars({ level }).map((height, index) => (
        <View key={index} style={[styles.bar, { backgroundColor: color, height }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  meter: { alignItems: 'center', flexDirection: 'row', gap: 3, height: 24 },
  bar: { borderRadius: 1.5, width: 3 },
});

export default LevelMeter;
