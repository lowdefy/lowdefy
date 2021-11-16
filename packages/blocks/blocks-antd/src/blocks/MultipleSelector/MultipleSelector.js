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
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';
import { get, type } from '@lowdefy/helpers';
import { Select } from 'antd';

import getUniqueValues from '../../getUniqueValues.js';
import getValueIndex from '../../getValueIndex.js';
import Label from '../Label/Label.js';

const Option = Select.Option;

const MultipleSelector = ({
  blockId,
  components: { Icon },
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
      components={{ Icon }}
      loading={loading}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      validation={validation}
      content={{
        content: () => (
          <div className={methods.makeCssClass({ width: '100%' })}>
            <div id={`${blockId}_popup`} />
            <Select
              id={`${blockId}_input`}
              allowClear={properties.allowClear !== false}
              autoFocus={properties.autoFocus}
              bordered={properties.bordered}
              className={methods.makeCssClass([{ width: '100%' }, properties.inputStyle])}
              disabled={properties.disabled}
              getPopupContainer={() => document.getElementById(`${blockId}_popup`)}
              mode="multiple"
              notFoundContent="Not found"
              placeholder={get(properties, 'placeholder', { default: 'Select items' })}
              showArrow={get(properties, 'showArrow', { default: true })}
              size={properties.size}
              value={getValueIndex(value, uniqueValueOptions, true)}
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
              menuItemSelectedIcon={
                properties.selectedIcon && (
                  <Icon
                    blockId={`${blockId}_selectedIcon`}
                    events={events}
                    properties={properties.selectedIcon}
                  />
                )
              }
              filterOption={(input, option) =>
                (option.filterstring || option.children.props.html || '')
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
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
            >
              {uniqueValueOptions.map((opt, i) =>
                type.isPrimitive(opt) ? (
                  <Option
                    className={methods.makeCssClass(properties.optionsStyle)}
                    id={`${blockId}_${i}`}
                    key={i}
                    value={`${i}`}
                  >
                    {renderHtml({ html: `${opt}`, methods })}
                  </Option>
                ) : (
                  <Option
                    className={methods.makeCssClass([properties.optionsStyle, opt.style])}
                    disabled={opt.disabled}
                    filterstring={opt.filterString}
                    id={`${blockId}_${i}`}
                    key={i}
                    value={`${i}`}
                  >
                    {type.isNone(opt.label)
                      ? renderHtml({ html: `${opt.value}`, methods })
                      : renderHtml({ html: opt.label, methods })}
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
