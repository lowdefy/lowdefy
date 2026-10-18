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
 * A step button of a NumberInput in spinner mode.
 *
 * @param {Object} props
 * @param {boolean} props.disabled
 * @param {string} props.label '+' or '−'.
 * @param {() => void} props.onPress
 * @param {string} props.testID
 * @param {Object} props.tokens The block's antd tokens.
 */
function StepButton({ disabled, label, onPress, testID, tokens }) {
  return (
    <Pressable
      accessibilityLabel={label === '+' ? 'Increase' : 'Decrease'}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={tokens.paddingXXS}
      onPress={onPress}
      style={{ paddingHorizontal: tokens.paddingXS }}
      testID={testID}
    >
      <Text
        style={{
          color: disabled ? tokens.colorTextDisabled : tokens.colorPrimary,
          fontSize: tokens.fontSizeLG,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default StepButton;
