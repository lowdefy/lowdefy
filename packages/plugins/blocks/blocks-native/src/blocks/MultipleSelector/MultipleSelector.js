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
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useScreenFocused } from '@lowdefy/client-native';
import { type } from '@lowdefy/helpers';

import getInputBoxStyle from '../../shared/getInputBoxStyle.js';
import getLabelProperties from '../Label/getLabelProperties.js';
import getLabelState from '../Label/getLabelState.js';
import getOptionIndex from '../Selector/getOptionIndex.js';
import getOptionIndices from './getOptionIndices.js';
import getOptionLabel from '../Selector/getOptionLabel.js';
import getOptionValue from '../Selector/getOptionValue.js';
import getSemanticColors from '../../shared/getSemanticColors.js';
import getSessionOptions from './getSessionOptions.js';
import Label from '../Label/Label.js';
import meta from './meta.js';
import MultipleSelectorRow from './MultipleSelectorRow.js';
import PickerSheet from '../Selector/PickerSheet.js';
import SystemIcon from '../../shared/SystemIcon.js';
import { isSameValues, toggleValue } from './toggleValue.js';
import useBlockTokens from '../../shared/useBlockTokens.js';
import ValueSummary from './ValueSummary.js';
import playFeedback from '../../device/playFeedback.js';

function getLabels({ options, values }) {
  return values.map((value) => {
    const index = getOptionIndex({ options, value });
    return index === null ? `${value}` : getOptionLabel({ option: options[index] });
  });
}

/**
 * A MultipleSelector: a field showing the chosen labels that opens a bottom sheet of the options
 * (the Selector's PickerSheet) to check several. `variant: sheet` draws the field as an iOS
 * Settings-style property row (MultipleSelectorRow), the title at the left; other variants draw
 * the input box under the title. The value is an array of the chosen options' values, as on the
 * web.
 *
 * Toggling a row checks or unchecks it without closing the sheet. The options chosen when the
 * sheet opens are listed first, and keep their place while rows are toggled. onChange fires once,
 * as the sheet closes (Done, a swipe down, or its screen no longer being shown), with the new
 * array when the set of values changed; `changeOn: toggle` sets the value and fires onChange on
 * each toggle instead.
 *
 * With `allowCreate`, search text that is no option's label or value can be added as a new value,
 * when it matches `createPattern`. The added value is chosen, and stays an option while the block
 * is shown, as do chosen values no option holds.
 */
function MultipleSelector({
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
  const { title } = getLabelState({ properties: labelProperties });
  const sheetRow = properties.variant === 'sheet';
  const changeOnToggle = properties.changeOn === 'toggle';
  const values = type.isArray(value) ? value : [];
  const [sessionValues, setSessionValues] = useState([]);
  const [draft, setDraft] = useState(null);
  const [first, setFirst] = useState([]);
  const [open, setOpen] = useState(false);
  // Guards the close, which the Done button and the sheet's own dismissal can both report.
  const openRef = useRef(false);
  const options = getSessionOptions({ options: properties.options ?? [], sessionValues });
  const current = draft ?? values;
  const labels = getLabels({ options, values: current });
  const placeholder = properties.placeholder ?? (sheetRow ? 'None' : 'Select items');
  const disabled = loading === true || properties.disabled === true;
  const full = type.isNumber(properties.maxCount) && current.length >= properties.maxCount;

  const setNext = (next) => {
    playFeedback();
    methods.setValue(next);
    methods.triggerEvent({ name: 'onChange', event: { value: next } });
  };
  const openSheet = () => {
    openRef.current = true;
    const missing = values.filter((item) => getOptionIndex({ options, value: item }) === null);
    if (missing.length > 0) setSessionValues((previous) => [...previous, ...missing]);
    setFirst(values);
    setDraft(changeOnToggle ? null : values);
    setOpen(true);
    methods.triggerEvent({ name: 'onOpenChange', event: { open: true } });
  };
  const closeSheet = () => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    if (draft !== null) {
      setDraft(null);
      if (!isSameValues(draft, values)) setNext(draft);
    }
    methods.triggerEvent({ name: 'onOpenChange', event: { open: false } });
  };
  const pick = (row) => {
    let next;
    if (row.create) {
      setSessionValues((previous) => [...previous, row.value]);
      setFirst((previous) => [...previous, row.value]);
      next = [...current, row.value];
    } else {
      next = toggleValue({
        value: getOptionValue({ option: options[row.index] }),
        values: current,
      });
    }
    if (changeOnToggle) {
      setNext(next);
    } else {
      setDraft(next);
    }
  };

  // The sheet is drawn above the whole app, so it closes when its screen stops being the one
  // shown.
  const focused = useScreenFocused();
  useEffect(() => {
    if (!focused) closeSheet();
  }, [focused]);

  const { box, text } = getInputBoxStyle({
    disabled,
    properties,
    status: validation?.status,
    tokens,
  });
  let field;
  if (sheetRow) {
    field = (
      <MultipleSelectorRow
        blockId={blockId}
        components={components}
        labels={labels}
        placeholder={placeholder}
        required={required}
        styles={styles}
        title={title}
        tokens={tokens}
      />
    );
  } else {
    field = (
      <>
        {labels.length === 0 ? (
          <Text
            numberOfLines={1}
            style={[text, { color: tokens.colorTertiaryLabel, flex: 1 }, styles.value]}
          >
            {placeholder}
          </Text>
        ) : (
          <ValueSummary
            align="left"
            labels={labels}
            style={[text, styles.value]}
            testID={`${blockId}_value`}
          />
        )}
        <SystemIcon
          color={tokens.colorTextTertiary}
          components={components}
          fallback="ChevronsUpDown"
          size={13}
          symbol="chevron.up.chevron.down"
        />
      </>
    );
  }
  return (
    <Label
      blockId={blockId}
      properties={sheetRow ? { ...labelProperties, disabled: true } : labelProperties}
      required={required}
      styles={styles}
      tokens={tokens}
      validation={validation}
    >
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        accessibilityValue={{ text: labels.length === 0 ? placeholder : labels.join(', ') }}
        disabled={disabled}
        onPress={openSheet}
        style={({ pressed }) =>
          sheetRow
            ? {
                backgroundColor: pressed ? colors.cellPressed : 'transparent',
                opacity: disabled ? 0.5 : 1,
              }
            : [box, { gap: 6 }, pressed ? { opacity: 0.7 } : null, styles.element]
        }
        testID={`${blockId}_input`}
      >
        {field}
      </Pressable>
      <PickerSheet
        blockId={blockId}
        components={components}
        create={
          properties.allowCreate === true
            ? { message: properties.createPatternMessage, pattern: properties.createPattern }
            : null
        }
        first={getOptionIndices({ options, values: first })}
        full={full}
        isDark={isDark}
        multiple
        onClose={closeSheet}
        onPick={pick}
        open={open && !disabled}
        options={options}
        searchThreshold={properties.searchThreshold}
        selected={getOptionIndices({ options, values: current })}
        title={properties.menuTitle ?? title}
        tokens={tokens}
      />
    </Label>
  );
}

MultipleSelector.meta = meta;

export default MultipleSelector;
