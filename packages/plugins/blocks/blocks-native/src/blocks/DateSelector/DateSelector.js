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

import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { type } from '@lowdefy/helpers';

import ClearButton from '../../shared/ClearButton.js';
import formatDateValue from './formatDateValue.js';
import getInputBoxStyle from '../../shared/getInputBoxStyle.js';
import getLabelProperties from '../Label/getLabelProperties.js';
import Label from '../Label/Label.js';
import meta from './meta.js';
import toBoundDate from './toBoundDate.js';
import toPickerDate from './toPickerDate.js';
import toUtcDay from './toUtcDay.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

// The field shows the chosen day; pressing it opens the platform's date picker: the calendar
// under the field on iOS, Material's date dialog on Android. Picking a day sets the value and
// closes the picker.
function DateSelector({
  blockId,
  loading,
  methods,
  properties,
  required,
  styles,
  validation,
  value,
}) {
  const [open, setOpen] = useState(false);
  const { isDark, tokens } = useBlockTokens({ properties });
  const { accessibilityLabel, labelProperties } = getLabelProperties({ blockId, properties });
  const disabled = loading === true || properties.disabled === true;
  const { box, text } = getInputBoxStyle({
    disabled,
    properties,
    status: validation?.status,
    tokens,
  });
  const display = formatDateValue({
    format: properties.format,
    locale: methods.getLocale(),
    value,
  });
  const setOpenState = (next) => {
    setOpen(next);
    methods.triggerEvent({ name: 'onOpenChange', event: { open: next } });
  };
  const setDate = (next) => {
    methods.setValue(next);
    methods.triggerEvent({ name: 'onChange', event: { value: next } });
  };
  return (
    <Label
      blockId={blockId}
      properties={labelProperties}
      required={required}
      styles={styles}
      tokens={tokens}
      validation={validation}
    >
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        accessibilityValue={{ text: display ?? '' }}
        disabled={disabled}
        onPress={() => setOpenState(!open)}
        style={[box, styles.element]}
        testID={`${blockId}_input`}
      >
        <Text
          style={[
            text,
            { flex: 1 },
            display === null ? { color: tokens.colorTextPlaceholder } : null,
          ]}
        >
          {display ?? properties.placeholder ?? 'Select date'}
        </Text>
        {properties.allowClear !== false && !disabled && type.isDate(value) ? (
          <ClearButton
            blockId={blockId}
            onPress={() => {
              setDate(null);
              methods.triggerEvent({ name: 'onClear' });
            }}
            tokens={tokens}
          />
        ) : null}
      </Pressable>
      {open ? (
        <View style={{ marginTop: tokens.marginXS }}>
          <DateTimePicker
            accentColor={tokens.colorPrimary}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={toBoundDate({ bound: properties.disabledDates?.max })}
            minimumDate={toBoundDate({ bound: properties.disabledDates?.min })}
            mode="date"
            onDismiss={() => setOpenState(false)}
            onValueChange={(event, date) => {
              setDate(toUtcDay({ date }));
              setOpenState(false);
            }}
            presentation="dialog"
            testID={`${blockId}_picker`}
            themeVariant={isDark ? 'dark' : 'light'}
            value={toPickerDate({ value })}
          />
        </View>
      ) : null}
    </Label>
  );
}

DateSelector.meta = meta;

export default DateSelector;
