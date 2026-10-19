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
import { TextInput, View } from 'react-native';

import ClearButton from '../../shared/ClearButton.js';
import iosTextStyles from '../../shared/iosTextStyles.js';
import SystemIcon from '../../shared/SystemIcon.js';

/**
 * The search field at the top of a picker sheet, as iOS draws one: a rounded field in the
 * tertiary fill with a magnifier glyph, its placeholder in the tertiary label colour and a clear
 * button while it holds text.
 *
 * @param {Object} props
 * @param {string} props.accessibilityLabel
 * @param {string} props.blockId
 * @param {Object} props.colors getSemanticColors' colours.
 * @param {Object} props.components
 * @param {(text: string) => void} props.onChangeText
 * @param {() => void} props.onFocus
 * @param {() => void} [props.onSubmitEditing] Called when the keyboard's search key is pressed.
 * @param {string} [props.placeholder]
 * @param {Object} props.tokens
 * @param {string} props.value
 */
function PickerSearchField({
  accessibilityLabel,
  blockId,
  colors,
  components,
  onChangeText,
  onFocus,
  onSubmitEditing,
  placeholder = 'Search',
  tokens,
  value,
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: tokens.colorTertiarySystemFill,
        borderRadius: 10,
        flexDirection: 'row',
        gap: 6,
        height: 36,
        marginBottom: 8,
        marginHorizontal: 16,
        marginTop: 8,
        paddingHorizontal: 8,
      }}
    >
      <SystemIcon
        color={colors.secondaryLabel}
        components={components}
        fallback="Search"
        size={15}
        symbol="magnifyingglass"
      />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        enterKeyHint="search"
        onChangeText={onChangeText}
        onFocus={onFocus}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryLabel}
        returnKeyType="search"
        selectionColor={tokens.colorTint}
        style={{
          color: colors.label,
          flex: 1,
          fontSize: iosTextStyles.body.fontSize,
          height: 36,
          letterSpacing: iosTextStyles.body.letterSpacing,
          padding: 0,
        }}
        testID={`${blockId}_search`}
        value={value}
      />
      {value === '' ? null : (
        <ClearButton
          blockId={`${blockId}_search`}
          onPress={() => onChangeText('')}
          tokens={tokens}
        />
      )}
    </View>
  );
}

export default PickerSearchField;
