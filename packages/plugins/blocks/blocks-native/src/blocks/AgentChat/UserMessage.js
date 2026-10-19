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

import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import getMessageText from './getMessageText.js';

/**
 * A message the person sent: their text in a tinted bubble at the trailing edge, as Messages and
 * the chat apps draw it. A long press opens its actions (Copy).
 *
 * @param {Object} props
 * @param {Object} props.colors
 * @param {Object} props.message
 * @param {(message: Object) => void} props.onLongPress
 * @param {string} props.testID
 */
function UserMessage({ colors, message, onLongPress, testID }) {
  const text = getMessageText(message);
  const files = (message.parts ?? []).filter((part) => part.type === 'file');
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityHint="Long press for actions"
        delayLongPress={300}
        onLongPress={() => onLongPress(message)}
        style={({ pressed }) => [
          styles.bubble,
          { backgroundColor: colors.tintFill },
          pressed ? { opacity: 0.85 } : null,
        ]}
        testID={testID}
      >
        {files.length > 0 ? (
          <Text style={[styles.files, { color: colors.secondary }]}>
            {files.map((part) => part.filename ?? 'File').join(', ')}
          </Text>
        ) : null}
        {text === '' ? null : <Text style={[styles.text, { color: colors.label }]}>{text}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-end', paddingLeft: 48 },
  bubble: {
    borderCurve: 'continuous',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  files: { fontSize: 13, lineHeight: 18, marginBottom: 2 },
  text: { fontSize: 17, letterSpacing: -0.41, lineHeight: 22 },
});

export default memo(UserMessage);
