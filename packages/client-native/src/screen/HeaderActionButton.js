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

import useTheme from '../theme/useTheme.js';

const SIZE = 36;
const ICON_SIZE = 22;

/**
 * One of a Screen's header actions as an icon button at its natural size: a 36pt square holding a
 * 22pt icon, in the label colour. A native bar puts its glass background around it (iOS 26),
 * which draws the compact circular button iOS's own header buttons are. The shell draws it where
 * the platform has no native bar button for the action (Android, or an icon with no SF Symbol).
 */
function HeaderActionButton({ action, Icon, testID }) {
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityLabel={action.title}
      accessibilityRole="button"
      accessibilityState={{ disabled: action.disabled }}
      disabled={action.disabled}
      hitSlop={4}
      onPress={action.onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        height: SIZE,
        justifyContent: 'center',
        opacity: action.disabled || pressed ? 0.4 : 1,
        width: SIZE,
      })}
      testID={testID}
    >
      <Icon
        properties={{ name: action.icon, title: '' }}
        styles={{ element: { color: tokens.colorText, fontSize: ICON_SIZE } }}
      />
    </Pressable>
  );
}

export default HeaderActionButton;
