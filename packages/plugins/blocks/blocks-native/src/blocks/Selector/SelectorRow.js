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
import { Text } from 'react-native';
import { type } from '@lowdefy/helpers';

import getOptionLabel from './getOptionLabel.js';
import getPropertyRowTextStyles from '../../shared/getPropertyRowTextStyles.js';
import OptionGlyph from '../../shared/OptionGlyph.js';
import PropertyRow from '../../shared/PropertyRow.js';
import SystemIcon from '../../shared/SystemIcon.js';

const GLYPH_SIZE = 20;

/**
 * The iOS Settings-style property row (PropertyRow) of a Selector with `variant: menu` or
 * `variant: sheet`: the title at the left and the chosen option at the right (its icon or avatar,
 * its label and an up-down chevron), or the placeholder while nothing is chosen. The variant
 * wraps it in what opens its options; the menu variant gives the row itself its accessibility
 * props.
 *
 * @param {Object} props
 * @param {string} [props.accessibilityLabel]
 * @param {string} [props.accessibilityRole]
 * @param {Object} [props.accessibilityValue]
 * @param {string} props.blockId
 * @param {Object} props.components
 * @param {boolean} props.isDark
 * @param {string} props.placeholder
 * @param {boolean} [props.required]
 * @param {*} props.selected The chosen option, or null.
 * @param {Object} props.styles The block's style slots.
 * @param {string} [props.title]
 * @param {Object} props.tokens
 */
function SelectorRow({
  accessibilityLabel,
  accessibilityRole,
  accessibilityValue,
  blockId,
  components,
  isDark,
  placeholder,
  required,
  selected,
  styles,
  title,
  tokens,
}) {
  const text = getPropertyRowTextStyles({ tokens });
  return (
    <PropertyRow
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityValue={accessibilityValue}
      required={required}
      styles={styles}
      testID={`${blockId}_row`}
      title={title}
      tokens={tokens}
    >
      {type.isObject(selected) ? (
        <OptionGlyph
          avatar={selected.avatar}
          color={selected.iconColor}
          components={components}
          icon={selected.icon}
          isDark={isDark}
          symbol={selected.symbol}
          size={GLYPH_SIZE}
          testID={`${blockId}_glyph`}
          tokens={tokens}
        />
      ) : null}
      <Text numberOfLines={1} style={[text.value, { flexShrink: 1 }, styles.value]}>
        {selected === null ? placeholder : getOptionLabel({ option: selected })}
      </Text>
      <SystemIcon
        color={tokens.colorTextTertiary}
        components={components}
        fallback="ChevronsUpDown"
        size={13}
        symbol="chevron.up.chevron.down"
      />
    </PropertyRow>
  );
}

export default SelectorRow;
