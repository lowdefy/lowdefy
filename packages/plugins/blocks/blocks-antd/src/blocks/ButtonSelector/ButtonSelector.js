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
import { ConfigProvider, Radio } from 'antd';
import { renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import Label from '../Label/Label.js';
import getValueIndex from '../../getValueIndex.js';
import getUniqueValues from '../../getUniqueValues.js';
import withTheme from '../withTheme.js';

const ButtonSelector = ({
  blockId,
  classNames = {},
  components,
  events,
  loading,
  properties,
  required,
  styles = {},
  validation,
  value,
  methods,
}) => {
  const uniqueValueOptions = getUniqueValues(properties.options || []);
  const radioGroup = (
    <Radio.Group
      id={`${blockId}_input`}
      className={classNames.element}
      disabled={properties.disabled || loading}
      size={properties.size}
      buttonStyle={properties.buttonStyle ? properties.buttonStyle : 'solid'}
      style={styles.element}
      onChange={(event) => {
        const value = type.isPrimitive(uniqueValueOptions[event.target.value])
          ? uniqueValueOptions[event.target.value]
          : uniqueValueOptions[event.target.value].value;
        methods.setValue(value);
        methods.triggerEvent({ name: 'onChange', event: { value } });
      }}
      value={type.isNone(value) ? undefined : getValueIndex(value, properties.options || [])}
    >
      {uniqueValueOptions.map((opt, i) =>
        type.isPrimitive(opt) ? (
          <Radio.Button
            id={`${blockId}_${i}`}
            key={i}
            value={`${i}`}
            disabled={properties.disabled || loading}
          >
            {renderHtml({ html: `${opt}`, methods })}
          </Radio.Button>
        ) : (
          <Radio.Button
            id={`${blockId}_${i}`}
            key={i}
            value={`${i}`}
            disabled={opt.disabled || properties.disabled || loading}
            style={opt.style}
          >
            {type.isNone(opt.label)
              ? renderHtml({ html: `${opt.value}`, methods })
              : renderHtml({ html: opt.label, methods })}
          </Radio.Button>
        )
      )}
    </Radio.Group>
  );
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
        content: () =>
          properties.color ? (
            <ConfigProvider theme={{ components: { Radio: { colorPrimary: properties.color } } }}>
              {radioGroup}
            </ConfigProvider>
          ) : (
            radioGroup
          ),
      }}
    />
  );
};

ButtonSelector.meta = {
  valueType: 'any',
  category: 'input',
  icons: [...Label.meta.icons],
  cssKeys: ['element'],
};

export default withTheme('Radio', ButtonSelector);
