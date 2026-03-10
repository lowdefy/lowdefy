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
import { InputNumber } from 'antd';

import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';

const NumberInput = ({
  blockId,
  classNames = {},
  events,
  components,
  loading,
  properties,
  required,
  styles = {},
  validation,
  value,
}) => {
  return (
    <Label
      blockId={blockId}
      classNames={classNames}
      components={components}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      styles={styles}
      validation={validation}
      content={{
        content: () => (
          <InputNumber
            id={`${blockId}_input`}
            autoComplete="off"
            autoFocus={properties.autoFocus}
            variant={properties.bordered === false ? 'borderless' : properties.variant}
            className={classNames.element}
            style={{ width: '100%', ...styles.element }}
            controls={properties.controls}
            decimalSeparator={properties.decimalSeparator}
            disabled={properties.disabled || loading}
            formatter={properties.formatter}
            keyboard={properties.keyboard}
            max={properties.max}
            min={properties.min}
            parser={properties.parser}
            placeholder={properties.placeholder}
            precision={properties.precision}
            size={properties.size}
            status={validation.status}
            step={properties.step}
            onChange={(newVal) => {
              methods.setValue(newVal);
              methods.triggerEvent({ name: 'onChange', event: { value: newVal } });
            }}
            onPressEnter={() => {
              methods.triggerEvent({ name: 'onPressEnter' });
            }}
            onBlur={() => {
              methods.triggerEvent({ name: 'onBlur' });
            }}
            onFocus={() => {
              methods.triggerEvent({ name: 'onFocus' });
            }}
            value={value}
          />
        ),
      }}
    />
  );
};

NumberInput.meta = {
  valueType: 'number',
  category: 'input',
  icons: [...Label.meta.icons],
  cssKeys: ['element', 'label', 'extra', 'feedback'],
};

export default withTheme('InputNumber', NumberInput);
