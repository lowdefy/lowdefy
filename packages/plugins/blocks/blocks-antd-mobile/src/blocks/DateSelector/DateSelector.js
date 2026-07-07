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
import { DatePicker } from 'antd-mobile';
import { type } from '@lowdefy/helpers';
import { withBlockDefaults } from '@lowdefy/block-utils';

import FieldWrapper from '../../FieldWrapper.js';
import PickerTrigger from '../../PickerTrigger.js';

function formatValue(value, precision, locale) {
  if (!type.isDate(value)) return null;
  if (precision === 'minute' || precision === 'second' || precision === 'hour') {
    return value.toLocaleString(locale);
  }
  return value.toLocaleDateString(locale);
}

function DateSelector({
  blockId,
  classNames = {},
  loading,
  methods,
  properties,
  required,
  styles = {},
  validation,
  value,
}) {
  const [visible, setVisible] = useState(false);
  const precision = properties.precision ?? 'day';
  const formatted = formatValue(value, precision, methods.getLocale?.());
  return (
    <FieldWrapper
      blockId={blockId}
      classNames={classNames}
      methods={methods}
      properties={properties}
      required={required}
      styles={styles}
      validation={validation}
    >
      <PickerTrigger
        blockId={blockId}
        classNames={classNames}
        disabled={properties.disabled || loading}
        hasValue={Boolean(formatted)}
        label={formatted ?? (properties.placeholder ?? 'Select date')}
        onOpen={() => setVisible(true)}
        styles={styles}
      />
      <DatePicker
        cancelText={properties.cancelText}
        confirmText={properties.confirmText}
        max={type.isDate(properties.max) ? properties.max : undefined}
        min={type.isDate(properties.min) ? properties.min : undefined}
        precision={precision}
        title={properties.pickerTitle}
        value={type.isDate(value) ? value : undefined}
        visible={visible}
        onClose={() => setVisible(false)}
        onConfirm={(date) => {
          methods.setValue(date);
          methods.triggerEvent({ name: 'onChange', event: { value: date } });
        }}
      />
    </FieldWrapper>
  );
}

export default withBlockDefaults(DateSelector);
