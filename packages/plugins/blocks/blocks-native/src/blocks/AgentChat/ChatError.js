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
import { Pressable, StyleSheet, Text, View } from 'react-native';

import SystemIcon from '../../shared/SystemIcon.js';

/**
 * A reply that failed: what went wrong, and Try again, which asks for the reply once more.
 *
 * @param {Object} props
 * @param {Object} props.colors
 * @param {Object} props.components
 * @param {string} [props.message] The error's message.
 * @param {() => void} [props.onRetry] None while there is nothing to retry.
 * @param {string} props.testID
 * @param {Function} props.translate
 */
function ChatError({ colors, components, message, onRetry, testID, translate }) {
  return (
    <View
      accessibilityRole="alert"
      style={[styles.card, { backgroundColor: colors.cell, borderColor: colors.separator }]}
      testID={testID}
    >
      <View style={styles.header}>
        <SystemIcon
          color={colors.danger}
          components={components}
          fallback="TriangleAlert"
          size={16}
          symbol="exclamationmark.triangle.fill"
        />
        <Text style={[styles.title, { color: colors.label }]}>
          {translate('agent.chat.errorTitle')}
        </Text>
      </View>
      {message ? (
        <Text style={[styles.message, { color: colors.secondary }]}>{message}</Text>
      ) : null}
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retry,
            { backgroundColor: colors.tintFill },
            pressed ? { opacity: 0.7 } : null,
          ]}
          testID={`${testID}_retry`}
        >
          <SystemIcon
            color={colors.tint}
            components={components}
            fallback="RotateCcw"
            size={13}
            symbol="arrow.clockwise"
          />
          <Text style={[styles.retryLabel, { color: colors.tint }]}>
            {translate('agent.chat.retry')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    padding: 12,
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  title: { fontSize: 15, fontWeight: '600', letterSpacing: -0.24, lineHeight: 20 },
  message: { fontSize: 13, letterSpacing: -0.08, lineHeight: 18 },
  retry: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderCurve: 'continuous',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
  },
  retryLabel: { fontSize: 15, fontWeight: '600', letterSpacing: -0.24 },
});

export default ChatError;
