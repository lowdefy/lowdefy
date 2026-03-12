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
import { AutoComplete } from 'antd';
import { type } from '@lowdefy/helpers';

import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';

const Option = AutoComplete.Option;

const AutoCompleteInput = ({
  blockId,
  classNames = {},
  components,
  events,
  loading,
  methods,
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
      validation={validation}
      required={required}
      styles={styles}
      content={{
        content: () => (
          <AutoComplete
            id={`${blockId}_input`}
            autoFocus={properties.autoFocus}
            backfill={properties.backfill}
            variant={properties.bordered === false ? 'borderless' : properties.variant}
            className={classNames.element}
            style={{ width: '100%', ...styles.element }}
            defaultOpen={properties.defaultOpen}
            disabled={properties.disabled || loading}
            placeholder={properties.placeholder ?? 'Type or select item'}
            allowClear={properties.allowClear !== false}
            size={properties.size}
            status={validation.status}
            filterOption={(input, option) =>
              `${option.value}`.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            onChange={(newVal) => {
              methods.setValue(newVal);
              methods.triggerEvent({ name: 'onChange', event: { value: newVal } });
            }}
            onFocus={() => {
              methods.triggerEvent({ name: 'onFocus' });
            }}
            onBlur={() => {
              methods.triggerEvent({ name: 'onBlur' });
            }}
            onClear={() => {
              methods.triggerEvent({ name: 'onClear' });
            }}
            onSearch={(newVal) => {
              methods.triggerEvent({ name: 'onSearch', event: { value: newVal } });
            }}
            value={type.isNone(value) ? undefined : `${value}`}
          >
            {(properties.options || []).map((opt, i) => (
              <Option
                style={styles.options}
                className={classNames.options}
                id={`${blockId}_${i}`}
                key={i}
                value={`${opt}`}
              >
                {`${opt}`}
              </Option>
            ))}
          </AutoComplete>
        ),
      }}
    />
  );
};

AutoCompleteInput.meta = {
  valueType: 'string',
  category: 'input',
  icons: [...Label.meta.icons],
  cssKeys: ['element', 'label', 'extra', 'feedback', 'options'],
};

export default withTheme('AutoComplete', AutoCompleteInput);
