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
import { View } from 'react-native';
import { Host, Picker } from '@expo/ui';
import { type } from '@lowdefy/helpers';

import getInputBoxStyle from '../../shared/getInputBoxStyle.js';
import getLabelProperties from '../Label/getLabelProperties.js';
import getOptionIndex from './getOptionIndex.js';
import getOptionLabel from './getOptionLabel.js';
import getOptionValue from './getOptionValue.js';
import Label from '../Label/Label.js';
import meta from './meta.js';
import SelectorMenu from './SelectorMenu.js';
import SelectorSheet from './SelectorSheet.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

// The picker item that stands for no value: shown while nothing is chosen, and kept when the
// input can be cleared.
const NO_VALUE = -1;

// The picker works on option indices, so an option may hold any value, as on the web.
// A disabled option is left out of the picker unless it is the one chosen.
// `variant: menu` draws a property row that opens a native menu instead (SelectorMenu), and
// `variant: sheet` the same row opening a bottom sheet of the options (SelectorSheet).
function Selector(props) {
  if (props.properties.variant === 'menu') {
    return <SelectorMenu {...props} />;
  }
  if (props.properties.variant === 'sheet') {
    return <SelectorSheet {...props} />;
  }
  return <SelectorPicker {...props} />;
}

function SelectorPicker({
  blockId,
  loading,
  methods,
  properties,
  required,
  styles,
  validation,
  value,
}) {
  const { isDark, tokens } = useBlockTokens({ properties });
  const { accessibilityLabel, labelProperties } = getLabelProperties({ properties });
  const disabled = loading === true || properties.disabled === true;
  const { box } = getInputBoxStyle({ disabled, properties, status: validation?.status, tokens });
  const options = properties.options ?? [];
  const selectedIndex = getOptionIndex({ options, value });
  const showNoValue = selectedIndex === null || properties.allowClear !== false;
  const items = options
    .map((option, index) => ({ index, option }))
    .filter(
      ({ index, option }) =>
        !(type.isObject(option) && option.disabled === true) || index === selectedIndex
    );
  return (
    <Label
      blockId={blockId}
      properties={labelProperties}
      required={required}
      styles={styles}
      tokens={tokens}
      validation={validation}
    >
      <View accessibilityLabel={accessibilityLabel} style={[box, styles.element]}>
        <Host colorScheme={isDark ? 'dark' : 'light'} matchContents seedColor={tokens.colorTint}>
          <Picker
            appearance={properties.appearance ?? 'menu'}
            enabled={!disabled}
            onValueChange={(index) => {
              const next = index === NO_VALUE ? null : getOptionValue({ option: options[index] });
              methods.setValue(next);
              methods.triggerEvent({ name: 'onChange', event: { value: next } });
              if (index === NO_VALUE) {
                methods.triggerEvent({ name: 'onClear' });
              }
            }}
            selectedValue={selectedIndex ?? NO_VALUE}
            testID={`${blockId}_input`}
          >
            {showNoValue ? (
              <Picker.Item label={properties.placeholder ?? 'Select item'} value={NO_VALUE} />
            ) : null}
            {items.map(({ index, option }) => (
              <Picker.Item key={index} label={getOptionLabel({ option })} value={index} />
            ))}
          </Picker>
        </Host>
      </View>
    </Label>
  );
}

Selector.meta = meta;

export default Selector;
