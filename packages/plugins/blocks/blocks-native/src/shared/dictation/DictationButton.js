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
import { Pressable, StyleSheet, View } from 'react-native';

import SystemIcon from '../SystemIcon.js';

/**
 * The dictation button at an input's trailing edge: a 28 pt microphone while idle, and a red stop
 * while a session runs. Tapping it toggles dictation. The host lists `Mic` in its meta.icons, for
 * the microphone where there are no SF Symbols.
 *
 * @param {Object} props
 * @param {{ danger: string, onTint: string, secondary: string }} props.colors The host's colours,
 *   as getTimelineColors gives them.
 * @param {Object} props.components The block's components, for the icon renderer.
 * @param {() => void} props.onPress
 * @param {'idle'|'listening'|'stopping'} props.status useDictation's status.
 * @param {string} [props.testID]
 * @param {(key: string) => string} props.translate The block's methods.translate.
 */
function DictationButton({ colors, components, onPress, status, testID, translate }) {
  const listening = status !== 'idle';
  return (
    <Pressable
      accessibilityLabel={translate(listening ? 'blocks.dictation.stop' : 'blocks.dictation.start')}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        listening ? { backgroundColor: colors.danger } : null,
        pressed ? { opacity: 0.6 } : null,
      ]}
      testID={testID}
    >
      {listening ? (
        <View style={[styles.stop, { backgroundColor: colors.onTint }]} />
      ) : (
        <SystemIcon
          color={colors.secondary}
          components={components}
          fallback="Mic"
          size={18}
          symbol="mic"
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  stop: { borderRadius: 2.5, height: 10, width: 10 },
});

export default DictationButton;
