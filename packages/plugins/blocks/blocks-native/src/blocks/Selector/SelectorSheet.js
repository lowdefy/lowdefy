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

import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { useScreenFocused } from '@lowdefy/client-native';

import getLabelProperties from '../Label/getLabelProperties.js';
import getLabelState from '../Label/getLabelState.js';
import getOptionIndex from './getOptionIndex.js';
import getOptionLabel from './getOptionLabel.js';
import getSemanticColors from '../../shared/getSemanticColors.js';
import Label from '../Label/Label.js';
import PickerSheet from './PickerSheet.js';
import SelectorRow from './SelectorRow.js';
import setSelectorValue from './setSelectorValue.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

/**
 * A Selector with `variant: sheet`: the property row of the menu variant (SelectorRow), that
 * opens a bottom sheet of the options (PickerSheet) in place of a native menu, so each option
 * can show its avatar's picture, a description and a pinned group, with a search field over a
 * long list. Picking a row sets the value, fires onChange (and onClear for the no-value row) as
 * the menu does, and closes the sheet.
 */
function SelectorSheet({
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
  const colors = getSemanticColors({ tokens });
  const { accessibilityLabel, labelProperties } = getLabelProperties({ blockId, properties });
  const { title } = getLabelState({ blockId, properties: labelProperties });
  const [open, setOpen] = useState(false);
  // The picker is drawn above the whole app, so it closes when its screen stops being the one
  // shown.
  const focused = useScreenFocused();
  useEffect(() => {
    if (!focused) setOpen(false);
  }, [focused]);
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
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        accessibilityValue={{
          text: selected === null ? placeholder : getOptionLabel({ option: selected }),
        }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.cellPressed : 'transparent',
          opacity: disabled ? 0.5 : 1,
        })}
        testID={`${blockId}_input`}
      >
        <SelectorRow
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
      </Pressable>
      <PickerSheet
        blockId={blockId}
        components={components}
        isDark={isDark}
        onClose={() => setOpen(false)}
        onPick={(row) => {
          setSelectorValue({ index: row.index, methods, options, selectedIndex });
          setOpen(false);
        }}
        open={open && !disabled}
        options={options}
        placeholder={placeholder}
        properties={properties}
        selectedIndex={selectedIndex}
        title={properties.menuTitle ?? title}
        tokens={tokens}
      />
    </Label>
  );
}

export default SelectorSheet;
