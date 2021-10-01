/*
  Copyright 2020-2021 Lowdefy, Inc

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
import { Checkbox, Space } from 'antd';
import { type } from '@lowdefy/helpers';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-tools';

import Label from '../Label/Label';
import getValueIndex from '../../getValueIndex';
import getUniqueValues from '../../getUniqueValues';

const CheckboxSelector = ({
  blockId,
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
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      loading={loading}
      content={{
        content: () => (
          <Checkbox.Group
            id={`${blockId}_input`}
            className={methods.makeCssClass([
              properties.color && {
                '& > label > span.ant-checkbox-checked:not(.ant-checkbox-disabled) > span': {
                  backgroundColor: `${properties.color} !important`,
                  borderColor: `${properties.color} !important`,
                },
              },
              properties.inputStyle,
            ])}
            disabled={properties.disabled}
            onChange={(newVal) => {
              const val = [];
              newVal.forEach((nv) => {
                val.push(
                  type.isPrimitive(uniqueValueOptions[nv])
                    ? uniqueValueOptions[nv]
                    : uniqueValueOptions[nv].value
                );
              });
              methods.setValue(val);
              methods.triggerEvent({ name: 'onChange' });
            }}
            value={getValueIndex(value, uniqueValueOptions, true)}
          >
            <Space
              direction={properties.direction}
              wrap={type.isNone(properties.wrap) ? true : properties.wrap}
              align={type.isNone(properties.align) ? 'start' : properties.align}
            >
              {uniqueValueOptions.map((opt, i) =>
                type.isPrimitive(opt) ? (
                  <Checkbox id={`${blockId}_${i}`} key={i} value={i}>
                    {renderHtml({ html: `${opt}`, methods })}
                  </Checkbox>
                ) : (
                  <Checkbox
                    id={`${blockId}_${i}`}
                    key={i}
                    value={i}
                    disabled={opt.disabled}
                    className={methods.makeCssClass(opt.style)}
                  >
                    {type.isNone(opt.label)
                      ? renderHtml({ html: `${opt.value}`, methods })
                      : renderHtml({ html: opt.label, methods })}
                  </Checkbox>
                )
              )}
            </Space>
          </Checkbox.Group>
        ),
      }}
    />
  );
};

CheckboxSelector.defaultProps = blockDefaultProps;

export default CheckboxSelector;
