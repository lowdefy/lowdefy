/*
  Copyright 2020 Lowdefy, Inc

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
import { Select } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-tools';
import { get, type } from '@lowdefy/helpers';
import Label from '../Label/Label';
import Icon from '../Icon/Icon';
import getValueIndex from '../../getValueIndex';
import getUniqueValues from '../../getUniqueValues';

const Option = Select.Option;

const MultipleSelector = ({
  blockId,
  loading,
  methods,
  properties,
  required,
  validation,
  value,
}) => {
  const uniqueValueOptions = getUniqueValues(properties.options || []);
  return (
    <Label
      blockId={`${blockId}_label`}
      loading={loading}
      methods={methods}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      validation={validation}
      content={{
        content: () => (
          <div className={methods.makeCssClass({ width: '100%' })}>
            <div id={`${blockId}_popup`} />
            <Select
              id={`${blockId}_input`}
              className={methods.makeCssClass([{ width: '100%' }, properties.inputStyle])}
              getPopupContainer={() => document.getElementById(`${blockId}_popup`)}
              mode="multiple"
              autoFocus={properties.autoFocus}
              disabled={properties.disabled}
              placeholder={get(properties, 'placeholder', { default: 'Select items' })}
              suffixIcon={
                properties.suffixIcon && (
                  <Icon
                    blockId={`${blockId}_suffixIcon`}
                    methods={methods}
                    properties={properties.suffixIcon}
                  />
                )
              }
              clearIcon={
                properties.clearIcon && (
                  <Icon
                    blockId={`${blockId}_clearIcon`}
                    methods={methods}
                    properties={properties.clearIcon}
                  />
                )
              }
              menuItemSelectedIcon={
                properties.selectedIcon && (
                  <Icon
                    blockId={`${blockId}_selectedIcon`}
                    methods={methods}
                    properties={properties.selectedIcon}
                  />
                )
              }
              showArrow={get(properties, 'showArrow', { default: true })}
              allowClear={properties.allowClear !== false}
              size={properties.size}
              filterOption={(input, option) =>
                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              notFoundContent="Not found"
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
                methods.callAction({ action: 'onChange' });
              }}
              value={getValueIndex(value, uniqueValueOptions, true)}
            >
              {uniqueValueOptions.map((opt, i) =>
                type.isPrimitive(opt) ? (
                  <Option
                    id={`${blockId}_${i}`}
                    key={i}
                    value={i}
                    className={methods.makeCssClass(properties.optionsStyle)}
                  >
                    {`${opt}`}
                  </Option>
                ) : (
                  <Option
                    id={`${blockId}_${i}`}
                    key={i}
                    value={i}
                    disabled={opt.disabled}
                    className={methods.makeCssClass(properties.optionsStyle)}
                  >
                    {type.isNone(opt.label) ? `${opt.value}` : opt.label}
                  </Option>
                )
              )}
            </Select>
          </div>
        ),
      }}
    />
  );
};

MultipleSelector.defaultProps = blockDefaultProps;

export default MultipleSelector;
