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

import iosTextStyles from './iosTextStyles.js';

/**
 * The Done button at the right of a sheet header, as iOS draws one: "Done" in Headline in the
 * tint colour, dimmed while pressed.
 *
 * @param {Object} props
 * @param {() => void} props.onPress
 * @param {string} props.testID
 * @param {Object} props.tokens
 */
function SheetDoneButton({ onPress, testID, tokens }) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.4 : 1 })}
      testID={testID}
    >
      <Text style={[iosTextStyles.headline, { color: tokens.colorTint }]}>Done</Text>
    </Pressable>
  );
}

export default SheetDoneButton;
