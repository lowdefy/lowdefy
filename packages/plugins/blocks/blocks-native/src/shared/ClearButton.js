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
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * The clear button an input shows while it has a value: iOS's filled circle with a cross, in the
 * tertiary label colour.
 *
 * @param {Object} props
 * @param {string} props.blockId
 * @param {() => void} props.onPress
 * @param {number} [props.size] The circle's size, 17 by default.
 * @param {Object} props.tokens The block's theme tokens.
 */
function ClearButton({ blockId, onPress, size = 17, tokens }) {
  return (
    <Pressable
      accessibilityLabel="Clear"
      accessibilityRole="button"
      hitSlop={12}
      onPress={onPress}
      style={{ marginLeft: 8 }}
      testID={`${blockId}_clear`}
    >
      <Svg height={size} viewBox="0 0 20 20" width={size}>
        <Circle cx="10" cy="10" fill={tokens.colorTertiaryLabel} r="10" />
        <Path
          d="M6.5 6.5l7 7M13.5 6.5l-7 7"
          stroke={tokens.colorCell}
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </Svg>
    </Pressable>
  );
}

export default ClearButton;
