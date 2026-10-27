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
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * The line above an input after dictation went wrong: "Microphone access is off." with a
 * Settings button that opens the app's settings page, or "Dictation stopped.". Nothing while
 * there is no warning. The host clears it (useDictation's clearWarning) on the next send or when
 * the field is emptied. The host lists `TriangleAlert` in its meta.icons.
 *
 * @param {Object} props
 * @param {{ tint: string, warning: string, warningText: string }} props.colors The host's colours,
 *   as getTimelineColors gives them.
 * @param {Object} props.components The block's components, for the icon renderer.
 * @param {string} [props.testID] The line's id; the Settings button takes it with `_settings`.
 * @param {(key: string) => string} props.translate The block's methods.translate.
 * @param {'denied'|'failed'|null} props.warning useDictation's warning.
 */
function DictationWarning({ colors, components, testID, translate, warning }) {
  if (warning === null) {
    return null;
  }
  return (
    <View accessibilityRole="alert" style={styles.line} testID={testID}>
      <components.Icon
        properties={{ name: 'TriangleAlert', size: 14, title: '' }}
        styles={{ element: { color: colors.warning } }}
      />
      <Text style={[styles.text, { color: colors.warningText }]}>
        {translate(`blocks.dictation.${warning}`)}
      </Text>
      {warning === 'denied' ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => Linking.openSettings()}
          testID={testID && `${testID}_settings`}
        >
          <Text style={[styles.settings, { color: colors.tint }]}>
            {translate('blocks.dictation.settings')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  text: { flex: 1, fontSize: 13, lineHeight: 18 },
  settings: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
});

export default DictationWarning;
