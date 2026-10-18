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

import getLabelProperties from '../Label/getLabelProperties.js';
import getLabelState from '../Label/getLabelState.js';
import getOptionIndex from './getOptionIndex.js';
import getOptionLabel from './getOptionLabel.js';
import getOptionValue from './getOptionValue.js';
import getSelectorMenuActions, { NO_VALUE_ID } from './getSelectorMenuActions.js';
import Label from '../Label/Label.js';
import NativeMenu from '../../shared/NativeMenu.js';
import OptionGlyph from '../../shared/OptionGlyph.js';
import SystemIcon from '../../shared/SystemIcon.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

const GLYPH_SIZE = 20;

/**
 * A Selector with `variant: menu`: an iOS Settings-style property row, the title at the left and
 * the chosen option at the right (its icon or avatar, its label and an up-down chevron), that
 * opens a native menu of the options with the chosen one checked. The validation message and
 * extra text show under the row, as the Label draws them.
 */
function SelectorMenu({
  blockId,
  components,
  loading,
  methods,
  properties,
  required,
  styles = {},
  validation,
  value,
}) {
  const { isDark, tokens } = useBlockTokens({ properties });
  const { accessibilityLabel, labelProperties } = getLabelProperties({ blockId, properties });
  const { title } = getLabelState({ blockId, properties: labelProperties });
  const options = properties.options ?? [];
  const selectedIndex = getOptionIndex({ options, value });
  const selected = selectedIndex === null ? null : options[selectedIndex];
  const placeholder = properties.placeholder ?? 'Select item';
  const disabled = loading === true || properties.disabled === true;
  return (
    <Label
      blockId={blockId}
      properties={{ ...labelProperties, disabled: true }}
      required={required}
      styles={styles}
      tokens={tokens}
      validation={validation}
    >
      <NativeMenu
        actions={getSelectorMenuActions({
          allowClear: properties.allowClear !== false,
          options,
          placeholder,
          selectedIndex,
        })}
        disabled={disabled}
        fullWidth
        menuTitle={properties.menuTitle}
        onSelect={(id) => {
          if (id === NO_VALUE_ID) {
            if (selectedIndex === null) return;
            methods.setValue(null);
            methods.triggerEvent({ name: 'onChange', event: { value: null } });
            methods.triggerEvent({ name: 'onClear' });
            return;
          }
          const index = Number(id);
          if (index === selectedIndex) return;
          const next = getOptionValue({ option: options[index] });
          methods.setValue(next);
          methods.triggerEvent({ name: 'onChange', event: { value: next } });
        }}
        testID={`${blockId}_input`}
      >
        <View
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          accessibilityValue={{
            text: selected === null ? placeholder : getOptionLabel({ option: selected }),
          }}
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
      </NativeMenu>
    </Label>
  );
}

export default SelectorMenu;
