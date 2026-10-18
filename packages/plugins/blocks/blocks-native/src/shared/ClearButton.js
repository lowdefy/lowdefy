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
import { Pressable, Text } from 'react-native';

/**
 * The clear button an input with `allowClear` shows while it has a value.
 *
 * @param {Object} props
 * @param {string} props.blockId
 * @param {() => void} props.onPress
 * @param {Object} props.tokens The block's antd tokens.
 */
function ClearButton({ blockId, onPress, tokens }) {
  return (
    <Pressable
      accessibilityLabel="Clear"
      accessibilityRole="button"
      hitSlop={tokens.paddingXS}
      onPress={onPress}
      style={{ marginLeft: tokens.marginXXS }}
      testID={`${blockId}_clear`}
    >
      <Text style={{ color: tokens.colorTextTertiary, fontSize: tokens.fontSizeLG }}>×</Text>
    </Pressable>
  );
}

export default ClearButton;
