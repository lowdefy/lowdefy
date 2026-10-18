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

import getLabelProperties from '../Label/getLabelProperties.js';
import getLabelState from '../Label/getLabelState.js';
import getOptionIndex from './getOptionIndex.js';
import getOptionLabel from './getOptionLabel.js';
import getSelectorMenuActions, { NO_VALUE_ID } from './getSelectorMenuActions.js';
import Label from '../Label/Label.js';
import NativeMenu from '../../shared/NativeMenu.js';
import SelectorRow from './SelectorRow.js';
import setSelectorValue from './setSelectorValue.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

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
        onSelect={(id) =>
          setSelectorValue({
            index: id === NO_VALUE_ID ? null : Number(id),
            methods,
            options,
            selectedIndex,
          })
        }
        testID={`${blockId}_input`}
      >
        <SelectorRow
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          accessibilityValue={{
            text: selected === null ? placeholder : getOptionLabel({ option: selected }),
          }}
          blockId={blockId}
          components={components}
          isDark={isDark}
          placeholder={placeholder}
          required={required}
          selected={selected}
          styles={styles}
          title={title}
          tokens={tokens}
        />
      </NativeMenu>
    </Label>
  );
}

export default SelectorMenu;
