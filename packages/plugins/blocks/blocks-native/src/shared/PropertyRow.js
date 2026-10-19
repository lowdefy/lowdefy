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
import { Pressable, Text, View } from 'react-native';

import getPropertyRowTextStyles from './getPropertyRowTextStyles.js';

const ROW = {
  alignItems: 'center',
  flexDirection: 'row',
  gap: 8,
  minHeight: 44,
  paddingHorizontal: 16,
  paddingVertical: 10,
};

const TRAILING = {
  alignItems: 'center',
  flex: 1,
  flexDirection: 'row',
  gap: 6,
  justifyContent: 'flex-end',
};

/**
 * An iOS Settings-style property row: the title at the left in Body, and the value at the right
 * (`children`: its text in the secondary label colour, a glyph, a chevron, or the field the value
 * is typed in), at least 44pt tall with a cell's 16pt padding. Selector (menu and sheet),
 * NumberInput, TextInput and DateSelector (`variant: row`) draw their rows with it, so a List
 * mixing them lines up. With `onPress` the row is pressable, as a row that focuses its field is;
 * a row that opens a native menu leaves the press to the menu.
 *
 * The `element` style slot styles the row and `label` the title.
 *
 * @param {Object} props
 * @param {string} [props.accessibilityLabel]
 * @param {string} [props.accessibilityRole]
 * @param {Object} [props.accessibilityState]
 * @param {Object} [props.accessibilityValue]
 * @param {boolean} [props.disabled] Dim the row, and take no press.
 * @param {() => void} [props.onPress]
 * @param {boolean} [props.required] Show the required mark before the title.
 * @param {Object} props.styles The block's style slots.
 * @param {string} [props.testID]
 * @param {string} [props.title]
 * @param {Object} props.tokens
 */
function PropertyRow({
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  accessibilityValue,
  children,
  disabled = false,
  onPress,
  required,
  styles,
  testID,
  title,
  tokens,
}) {
  const text = getPropertyRowTextStyles({ tokens });
  const RowView = onPress ? Pressable : View;
  return (
    <RowView
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityValue={accessibilityValue}
      disabled={onPress ? disabled : undefined}
      onPress={onPress}
      style={[ROW, disabled && onPress ? { opacity: 0.5 } : null, styles.element]}
      testID={testID}
    >
      <Text numberOfLines={1} style={[text.title, styles.label]}>
        {required === true ? <Text style={{ color: tokens.colorError }}>* </Text> : null}
        {title}
      </Text>
      <View style={TRAILING}>{children}</View>
    </RowView>
  );
}

export default PropertyRow;
