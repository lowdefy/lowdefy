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

import React, { useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';

import LevelMeter from './LevelMeter.js';

/**
 * The row above an input while dictation listens: a cross that cancels the session, the level
 * meter and "Listening". The host shows it while useDictation's status is not idle; it announces
 * "Listening" to VoiceOver and TalkBack when it appears, as a session starts. The host lists `X`
 * in its meta.icons.
 *
 * @param {Object} props
 * @param {{ danger: string, fillStrong: string, secondary: string }} props.colors The host's
 *   colours, as getTimelineColors gives them.
 * @param {Object} props.components The block's components, for the icon renderer.
 * @param {number} props.level useDictation's level.
 * @param {() => void} props.onCancel
 * @param {string} [props.testID] The row's id; the cross and the meter take it with `_cancel` and
 *   `_level`.
 * @param {(key: string) => string} props.translate The block's methods.translate.
 */
function ListeningRow({ colors, components, level, onCancel, testID, translate }) {
  const listening = translate('blocks.dictation.listening');
  // Once, as the session starts: a level change must not repeat it.
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(listening);
  }, []);
  return (
    <View style={styles.row} testID={testID}>
      <Pressable
        accessibilityLabel={translate('blocks.dictation.cancel')}
        accessibilityRole="button"
        hitSlop={10}
        onPress={onCancel}
        style={[styles.cancel, { backgroundColor: colors.fillStrong }]}
        testID={testID && `${testID}_cancel`}
      >
        <components.Icon
          properties={{ name: 'X', size: 11, strokeWidth: 3, title: '' }}
          styles={{ element: { color: colors.secondary } }}
        />
      </Pressable>
      <LevelMeter color={colors.danger} level={level} testID={testID && `${testID}_level`} />
      <Text style={[styles.text, { color: colors.secondary }]}>{listening}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  cancel: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  text: { flex: 1, fontSize: 13, lineHeight: 18 },
});

export default ListeningRow;
