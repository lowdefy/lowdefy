/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { blockDefaultProps } from '@lowdefy/block-utils';
import { InputNumber } from 'antd';

import Label from '../Label/Label.js';

const NumberInput = ({
  blockId,
  events,
  components,
  loading,
  methods,
  properties,
  required,
  validation,
  value,
}) => {
  return (
    <Label
      blockId={blockId}
      components={components}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      validation={validation}
      content={{
        content: () => (
          <InputNumber
            id={`${blockId}_input`}
            autoComplete="off"
            autoFocus={properties.autoFocus}
            bordered={properties.bordered}
            className={methods.makeCssClass([{ width: '100%' }, properties.inputStyle])}
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
              methods.triggerEvent({ name: 'onChange' });
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

NumberInput.defaultProps = blockDefaultProps;
NumberInput.meta = {
  valueType: 'number',
  category: 'input',
  icons: [...Label.meta.icons],
  styles: ['blocks/NumberInput/style.less'],
};

export default NumberInput;
