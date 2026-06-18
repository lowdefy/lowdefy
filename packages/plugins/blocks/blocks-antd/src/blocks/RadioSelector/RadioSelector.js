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
import { ConfigProvider, Radio, Space } from 'antd';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import Label from '../Label/Label.js';
import getSelectedIndex from '../../getSelectedIndex.js';
import useSelectorOptions from '../../useSelectorOptions.js';
import withTheme from '../withTheme.js';

const RadioGroup = Radio.Group;

const RadioSelector = ({
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
  const uniqueValueOptions = useSelectorOptions({ properties, methods });
  const selectedIndex = getSelectedIndex(value, uniqueValueOptions, { properties });
  const radioGroup = (
    <RadioGroup
      id={`${blockId}_input`}
      className={classNames.element}
      disabled={properties.disabled || loading}
      style={styles.element}
      onChange={(event) => {
        const val = type.isPrimitive(uniqueValueOptions[event.target.value])
          ? uniqueValueOptions[event.target.value]
          : uniqueValueOptions[event.target.value].value;
        methods.setValue(val);
        methods.triggerEvent({ name: 'onChange', event: { value: val } });
      }}
      value={`${getSelectedIndex(value, uniqueValueOptions, { properties })}`}
    >
      <Space
        direction={properties.direction}
        wrap={type.isNone(properties.wrap) ? true : properties.wrap}
        align={type.isNone(properties.align) ? 'start' : properties.align}
      >
        {uniqueValueOptions.map((opt, i) => {
          if (type.isPrimitive(opt)) {
            return (
              <Radio id={`${blockId}_${opt}`} key={i} value={`${i}`}>
                {renderHtml({ html: `${opt}`, methods })}
              </Radio>
            );
          }
          const isSelected = `${i}` === selectedIndex;
          const radio = (
            <Radio
              id={`${blockId}_${i}`}
              key={i}
              value={`${i}`}
              disabled={opt.disabled}
              style={{ ...opt.style, ...(isSelected && opt.color ? { color: opt.color } : {}) }}
            >
              {type.isNone(opt.label)
                ? renderHtml({ html: `${opt.value}`, methods })
                : renderHtml({ html: opt.label, methods })}
            </Radio>
          );
          if (type.isNone(opt.color)) return radio;
          // Per-option color: token override colors this radio's selected dot.
          return (
            <ConfigProvider key={i} theme={{ token: { colorPrimary: opt.color } }}>
              {radio}
            </ConfigProvider>
          );
        })}
      </Space>
    </RadioGroup>
  );
  return (
    <Label
      blockId={blockId}
      methods={methods}
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

export default withTheme('Radio', withBlockDefaults(RadioSelector));
