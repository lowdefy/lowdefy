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
import { Radio } from 'antd';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import Label from '../Label/Label.js';
import getValueIndex from '../../getValueIndex.js';
import getUniqueValues from '../../getUniqueValues.js';

const ButtonSelector = ({
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
          <Radio.Group
            id={`${blockId}_input`}
            className={methods.makeCssClass([
              properties.color && {
                '& > label.ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)':
                  {
                    backgroundColor: `${properties.color} !important`,
                    borderColor: `${properties.color} !important`,
                  },
              },
              properties.inputStyle,
            ])}
            disabled={properties.disabled || loading}
            size={properties.size}
            buttonStyle={properties.buttonStyle ? properties.buttonStyle : 'solid'}
            onChange={(event) => {
              methods.setValue(
                type.isPrimitive(uniqueValueOptions[event.target.value])
                  ? uniqueValueOptions[event.target.value]
                  : uniqueValueOptions[event.target.value].value
              );
              methods.triggerEvent({ name: 'onChange' });
            }}
            value={type.isNone(value) ? undefined : getValueIndex(value, properties.options || [])}
          >
            {uniqueValueOptions.map((opt, i) =>
              type.isPrimitive(opt) ? (
                <Radio.Button id={`${blockId}_${i}`} key={i} value={`${i}`}>
                  {renderHtml({ html: `${opt}`, methods })}
                </Radio.Button>
              ) : (
                <Radio.Button
                  id={`${blockId}_${i}`}
                  key={i}
                  value={`${i}`}
                  disabled={opt.disabled}
                  className={methods.makeCssClass(opt.style)}
                >
                  {type.isNone(opt.label)
                    ? renderHtml({ html: `${opt.value}`, methods })
                    : renderHtml({ html: opt.label, methods })}
                </Radio.Button>
              )
            )}
          </Radio.Group>
        ),
      }}
    />
  );
};

ButtonSelector.defaultProps = blockDefaultProps;
ButtonSelector.meta = {
  valueType: 'any',
  category: 'input',
  icons: [...Label.meta.icons],
  styles: ['blocks/ButtonSelector/style.less'],
};

export default ButtonSelector;
