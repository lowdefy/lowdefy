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

import { ROW_HEIGHT } from './getPickerSheetDetents.js';
import iosTextStyles from '../../shared/iosTextStyles.js';
import PickerRowLeading, { AVATAR_SIZE } from './PickerRowLeading.js';
import SystemIcon from '../../shared/SystemIcon.js';

const GAP = 12;
const PADDING = 16;

/**
 * One row of a Selector picker sheet, 52pt high: the leading avatar (the option's picture or
 * initials, or the dashed circle of the no-value row) or the option's glyph, the label in body
 * text with the option's description under it in footnote, and a checkmark in the tint colour
 * on the chosen row. The separator under it is inset to the label, or spans the sheet under the
 * pinned group. To a screen reader it is a button, selected when chosen.
 *
 * @param {Object} props
 * @param {string} props.blockId
 * @param {Object} props.colors getSemanticColors' colours.
 * @param {Object} props.components
 * @param {boolean} props.isDark
 * @param {(row: Object) => void} props.onPick
 * @param {Object} props.row A getPickerSheetRows row.
 * @param {boolean} props.showLeading The list has leading glyphs, so every row keeps their space.
 * @param {Object} props.tokens
 */
function PickerOptionRow({
  blockId,
  colors,
  components,
  isDark,
  onPick,
  row,
  showLeading,
  tokens,
}) {
  const labelInset = showLeading ? PADDING + AVATAR_SIZE + GAP : PADDING;
  return (
    <Pressable
      accessibilityLabel={row.description === null ? row.label : `${row.label}, ${row.description}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: row.disabled, selected: row.selected }}
      disabled={row.disabled}
      onPress={() => onPick(row)}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? colors.cellPressed : 'transparent',
        flexDirection: 'row',
        gap: GAP,
        height: ROW_HEIGHT,
        opacity: row.disabled ? 0.4 : 1,
        paddingHorizontal: PADDING,
      })}
      testID={`${blockId}_option_${row.key}`}
    >
      {showLeading ? (
        <View
          style={{
            alignItems: 'center',
            height: AVATAR_SIZE,
            justifyContent: 'center',
            width: AVATAR_SIZE,
          }}
        >
          <PickerRowLeading
            blockId={blockId}
            colors={colors}
            components={components}
            isDark={isDark}
            row={row}
            tokens={tokens}
          />
        </View>
      ) : null}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text numberOfLines={1} style={[iosTextStyles.body, { color: colors.label }]}>
          {row.label}
        </Text>
        {row.description === null ? null : (
          <Text
            numberOfLines={1}
            style={[iosTextStyles.footnote, { color: colors.secondaryLabel }]}
          >
            {row.description}
          </Text>
        )}
      </View>
      {row.selected ? (
        <SystemIcon
          color={tokens.colorTint}
          components={components}
          fallback="Check"
          size={17}
          symbol="checkmark"
          testID={`${blockId}_option_${row.key}_check`}
        />
      ) : null}
      {row.separator === 'none' ? null : (
        <View
          pointerEvents="none"
          style={{
            backgroundColor: colors.separator,
            bottom: 0,
            height: StyleSheet.hairlineWidth,
            left: row.separator === 'group' ? 0 : labelInset,
            position: 'absolute',
            right: 0,
          }}
          testID={`${blockId}_option_${row.key}_separator`}
        />
      )}
    </Pressable>
  );
}

export default PickerOptionRow;
