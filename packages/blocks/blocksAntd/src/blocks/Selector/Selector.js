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
import { Select } from 'antd';
import { blockDefaultProps, RenderHtml } from '@lowdefy/block-tools';
import { get, type } from '@lowdefy/helpers';
import Label from '../Label/Label';
import Icon from '../Icon/Icon';
import getValueIndex from '../../getValueIndex';
import getUniqueValues from '../../getUniqueValues';

const Option = Select.Option;

const Selector = ({
  blockId,
  events,
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
      blockId={blockId}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      loading={loading}
      content={{
        content: () => (
          <div className={methods.makeCssClass({ width: '100%' })}>
            <div id={`${blockId}_popup`} />
            <Select
              id={`${blockId}_input`}
              className={methods.makeCssClass([{ width: '100%' }, properties.inputStyle])}
              mode="single"
              autoFocus={properties.autoFocus}
              getPopupContainer={() => document.getElementById(`${blockId}_popup`)}
              disabled={properties.disabled}
              placeholder={get(properties, 'placeholder', { default: 'Select item' })}
              suffixIcon={
                properties.suffixIcon && (
                  <Icon
                    blockId={`${blockId}_suffixIcon`}
                    events={events}
                    properties={properties.suffixIcon}
                  />
                )
              }
              clearIcon={
                properties.clearIcon && (
                  <Icon
                    blockId={`${blockId}_clearIcon`}
                    events={events}
                    properties={properties.clearIcon}
                  />
                )
              }
              showArrow={properties.showArrow}
              allowClear={properties.allowClear !== false}
              showSearch={get(properties, 'showSearch', { default: true })}
              size={properties.size}
              filterOption={(input, option) =>
                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              notFoundContent="Not found"
              onChange={(newVal) => {
                methods.setValue(
                  type.isPrimitive(uniqueValueOptions[newVal])
                    ? uniqueValueOptions[newVal]
                    : uniqueValueOptions[newVal].value
                );
                methods.triggerEvent({ name: 'onChange' });
              }}
              value={getValueIndex(value, uniqueValueOptions)}
            >
              {uniqueValueOptions.map((opt, i) =>
                type.isPrimitive(opt) ? (
                  <Option
                    id={`${blockId}_${i}`}
                    key={i}
                    value={i}
                    className={methods.makeCssClass(properties.optionsStyle)}
                  >
                    <RenderHtml html={`${opt}`} methods={methods} />
                  </Option>
                ) : (
                  <Option
                    id={`${blockId}_${i}`}
                    key={i}
                    value={i}
                    disabled={opt.disabled}
                    className={methods.makeCssClass(properties.optionsStyle)}
                  >
                    <RenderHtml
                      html={type.isNone(opt.label) ? `${opt.value}` : opt.label}
                      methods={methods}
                      style={opt.style}
                    />
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

Selector.defaultProps = blockDefaultProps;

export default Selector;
