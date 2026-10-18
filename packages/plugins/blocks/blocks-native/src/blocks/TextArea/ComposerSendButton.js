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
import { ActivityIndicator, Pressable } from 'react-native';

const SIZE = 30;

/**
 * The send button of a composer TextArea: the tint circle with an up arrow, as iOS Messages
 * sends, greyed while there is nothing to send and a spinner while onSend runs.
 *
 * @param {Object} props
 * @param {string} props.blockId
 * @param {Object} props.components The block's components (Icon).
 * @param {boolean} props.disabled
 * @param {boolean} props.loading Whether the onSend actions are running.
 * @param {() => void} props.onPress
 * @param {Object} props.tokens The block's theme tokens.
 */
function ComposerSendButton({ blockId, components, disabled, loading, onPress, tokens }) {
  return (
    <Pressable
      accessibilityLabel="Send"
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: disabled || loading }}
      disabled={disabled || loading}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: disabled ? tokens.colorSystemFill : tokens.colorTint,
        borderRadius: SIZE / 2,
        height: SIZE,
        justifyContent: 'center',
        marginBottom: 3,
        marginLeft: 6,
        opacity: pressed ? 0.7 : 1,
        width: SIZE,
      })}
      testID={`${blockId}_send`}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <components.Icon
          properties={{ name: 'ArrowUp', strokeWidth: 2.5, title: '' }}
          styles={{ element: { color: disabled ? tokens.colorCell : '#FFFFFF', fontSize: 18 } }}
        />
      )}
    </Pressable>
  );
}

export default ComposerSendButton;
