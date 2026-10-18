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
import { Text, View } from 'react-native';
import { type } from '@lowdefy/helpers';

import getOptionLabel from './getOptionLabel.js';
import OptionGlyph from '../../shared/OptionGlyph.js';
import SystemIcon from '../../shared/SystemIcon.js';

const GLYPH_SIZE = 20;

/**
 * The iOS Settings-style property row of a Selector with `variant: menu` or `variant: sheet`:
 * the title at the left and the chosen option at the right (its icon or avatar, its label and an
 * up-down chevron), or the placeholder while nothing is chosen. The variant wraps it in what
 * opens its options; the menu variant gives the row itself its accessibility props.
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
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityValue={accessibilityValue}
      style={[
        {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          minHeight: 44,
          paddingHorizontal: 16,
          paddingVertical: 10,
        },
        styles.element,
      ]}
    >
      <Text numberOfLines={1} style={[{ color: tokens.colorText, fontSize: 17 }, styles.label]}>
        {required === true ? <Text style={{ color: tokens.colorError }}>* </Text> : null}
        {title}
      </Text>
      <View
        style={{
          alignItems: 'center',
          flex: 1,
          flexDirection: 'row',
          gap: 6,
          justifyContent: 'flex-end',
        }}
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
        <Text
          numberOfLines={1}
          style={[
            {
              color: selected === null ? tokens.colorTextTertiary : tokens.colorTextSecondary,
              flexShrink: 1,
              fontSize: 17,
            },
            styles.value,
          ]}
        >
          {selected === null ? placeholder : getOptionLabel({ option: selected })}
        </Text>
        <SystemIcon
          color={tokens.colorTextTertiary}
          components={components}
          fallback="ChevronsUpDown"
          size={13}
          symbol="chevron.up.chevron.down"
        />
      </View>
    </View>
  );
}

export default SelectorRow;
