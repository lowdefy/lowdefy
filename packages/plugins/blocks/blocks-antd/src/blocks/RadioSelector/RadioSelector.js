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
import { Radio, Space } from 'antd';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import Label from '../Label/Label.js';
import getValueIndex from '../../getValueIndex.js';
import getUniqueValues from '../../getUniqueValues.js';

const RadioGroup = Radio.Group;

const RadioSelector = ({
  blockId,
  components,
  events,
  loading,
  properties,
  required,
  validation,
  value,
  methods,
}) => {
  const uniqueValueOptions = getUniqueValues(properties.options || []);
  return (
    <Label
      blockId={blockId}
      components={components}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      content={{
        content: () => (
          <RadioGroup
            id={`${blockId}_input`}
            className={methods.makeCssClass([
              properties.color && {
                '& > label > span.ant-radio-checked:not(.ant-radio-disabled) > span': {
                  borderColor: `${properties.color} !important`,
                  '&:after': {
                    backgroundColor: `${properties.color} !important`,
                  },
                },
              },
              properties.inputStyle,
            ])}
            disabled={properties.disabled || loading}
            onChange={(event) => {
              methods.setValue(
                type.isPrimitive(uniqueValueOptions[event.target.value])
                  ? uniqueValueOptions[event.target.value]
                  : uniqueValueOptions[event.target.value].value
              );
              methods.triggerEvent({ name: 'onChange' });
            }}
            value={`${getValueIndex(value, uniqueValueOptions)}`}
          >
            <Space
              direction={properties.direction}
              wrap={type.isNone(properties.wrap) ? true : properties.wrap}
              align={type.isNone(properties.align) ? 'start' : properties.align}
            >
              {uniqueValueOptions.map((opt, i) =>
                type.isPrimitive(opt) ? (
                  <Radio id={`${blockId}_${opt}`} key={i} value={`${i}`}>
                    {renderHtml({ html: `${opt}`, methods })}
                  </Radio>
                ) : (
                  <Radio
                    id={`${blockId}_${i}`}
                    key={i}
                    value={`${i}`}
                    disabled={opt.disabled}
                    className={methods.makeCssClass(opt.style)}
                  >
                    {type.isNone(opt.label)
                      ? renderHtml({ html: `${opt.value}`, methods })
                      : renderHtml({ html: opt.label, methods })}
                  </Radio>
                )
              )}
            </Space>
          </RadioGroup>
        ),
      }}
    />
  );
};

RadioSelector.defaultProps = blockDefaultProps;
RadioSelector.meta = {
  valueType: 'any',
  category: 'input',
  icons: [...Label.meta.icons],
  styles: ['blocks/RadioSelector/style.less'],
};

export default RadioSelector;
