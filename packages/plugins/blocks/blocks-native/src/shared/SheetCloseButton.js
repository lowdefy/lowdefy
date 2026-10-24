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
import { Pressable } from 'react-native';

import SystemIcon from './SystemIcon.js';

const SIZE = 30;

/**
 * The close button at the right of a sheet header: iOS's round grey button with a cross.
 *
 * @param {Object} props
 * @param {Object} props.components
 * @param {() => void} props.onPress
 * @param {string} props.testID
 * @param {Object} props.tokens
 */
function SheetCloseButton({ components, onPress, testID, tokens }) {
  return (
    <Pressable
      accessibilityLabel="Close"
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: tokens.colorFillSecondary,
        borderRadius: SIZE / 2,
        height: SIZE,
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
        width: SIZE,
      })}
      testID={testID}
    >
      <SystemIcon
        color={tokens.colorTextSecondary}
        components={components}
        fallback="X"
        size={13}
        symbol="xmark"
      />
    </Pressable>
  );
}

export default SheetCloseButton;
