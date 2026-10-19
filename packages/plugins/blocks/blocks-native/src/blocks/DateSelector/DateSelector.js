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
import getDateMenuActions from './getDateMenuActions.js';
import getInputBoxStyle from '../../shared/getInputBoxStyle.js';
import getLabelProperties from '../Label/getLabelProperties.js';
import getLabelState from '../Label/getLabelState.js';
import getPropertyRowTextStyles from '../../shared/getPropertyRowTextStyles.js';
import Label from '../Label/Label.js';
import meta from './meta.js';
import NativeMenu from '../../shared/NativeMenu.js';
import PropertyRow from '../../shared/PropertyRow.js';
import SystemIcon from '../../shared/SystemIcon.js';
import toBoundDate from './toBoundDate.js';
import toPickerDate from './toPickerDate.js';
import toUtcDay from './toUtcDay.js';
import useBlockTokens from '../../shared/useBlockTokens.js';

function toUtcBound({ bound }) {
  const date = toBoundDate({ bound });
  return date === undefined ? undefined : toUtcDay({ date });
}

// The field shows the chosen day; pressing it opens the platform's date picker: the calendar
// under the field on iOS, Material's date dialog on Android. Picking a day sets the value and
// closes the picker.
//
// `variant: row` is an iOS Settings-style row (PropertyRow): the title at the left and the day at
// the right in the secondary label colour with an up-down chevron, "Not set" while there is none.
// Pressing it opens a native menu, as Reminders offers a date: Today, Tomorrow, Next week, "Pick a
// date…" (the calendar under the row) and Clear.
function DateSelector({
  blockId,
  components,
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
  const { accessibilityLabel, labelProperties } = getLabelProperties({ properties });
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
  const picker = open ? (
    <View
      style={
        properties.variant === 'row'
          ? { paddingBottom: 8, paddingHorizontal: 16 }
          : { marginTop: 8 }
      }
    >
      <DateTimePicker
        accentColor={tokens.colorTint}
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
  ) : null;
  if (properties.variant === 'row') {
    const rowText = getPropertyRowTextStyles({ tokens });
    const { title } = getLabelState({ properties: labelProperties });
    const placeholder = properties.placeholder ?? 'Not set';
    const { actions, days } = getDateMenuActions({
      allowClear: properties.allowClear !== false,
      max: toUtcBound({ bound: properties.disabledDates?.max }),
      min: toUtcBound({ bound: properties.disabledDates?.min }),
      today: toUtcDay({ date: new Date() }),
      value: type.isDate(value) ? value : null,
    });
    const onSelect = (id) => {
      if (id === 'pick') {
        setOpenState(true);
        return;
      }
      if (open) {
        setOpenState(false);
      }
      if (id === 'clear') {
        setDate(null);
        methods.triggerEvent({ name: 'onClear' });
        return;
      }
      if (!type.isDate(value) || value.getTime() !== days[id].getTime()) {
        setDate(days[id]);
      }
    };
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
          actions={actions}
          disabled={disabled}
          fullWidth
          onSelect={onSelect}
          testID={`${blockId}_input`}
        >
          <PropertyRow
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            accessibilityValue={{ text: display ?? placeholder }}
            required={required}
            styles={styles}
            testID={`${blockId}_row`}
            title={title}
            tokens={tokens}
          >
            <Text numberOfLines={1} style={[rowText.value, { flexShrink: 1 }, styles.value]}>
              {display ?? placeholder}
            </Text>
            <SystemIcon
              color={tokens.colorTextTertiary}
              components={components}
              fallback="ChevronsUpDown"
              size={13}
              symbol="chevron.up.chevron.down"
            />
          </PropertyRow>
        </NativeMenu>
        {picker}
      </Label>
    );
  }
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
            display === null ? { color: tokens.colorTertiaryLabel } : null,
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
      {picker}
    </Label>
  );
}

DateSelector.meta = meta;

export default DateSelector;
