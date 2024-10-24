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

import React, { useState } from 'react';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';
import { get, type } from '@lowdefy/helpers';
import { Select } from 'antd';

import Label from '../Label/Label.js';
import getValueIndex from '../../getValueIndex.js';
import getUniqueValues from '../../getUniqueValues.js';

const Option = Select.Option;

const Selector = ({
  blockId,
  components: { Icon, Link },
  events,
  loading,
  methods,
  properties,
  required,
  validation,
  value,
}) => {
  const [fetchState, setFetch] = useState(false);
  const [elementId] = useState((0 | (Math.random() * 9e2)) + 1e2);
  const uniqueValueOptions = getUniqueValues(properties.options || []);
  return (
    <Label
      blockId={blockId}
      components={{ Icon, Link }}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      content={{
        content: () => (
          <div className={methods.makeCssClass({ width: '100%' })}>
            <div id={`${blockId}_${elementId}_popup`} />
            <Select
              id={`${blockId}_input`}
              bordered={properties.bordered}
              className={methods.makeCssClass([{ width: '100%' }, properties.inputStyle])}
              mode="single"
              autoFocus={properties.autoFocus}
              getPopupContainer={() => document.getElementById(`${blockId}_${elementId}_popup`)}
              disabled={properties.disabled || loading}
              placeholder={get(properties, 'placeholder', { default: 'Select item' })}
              status={validation.status}
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
                (option.filterstring || option.children.props.html || '')
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
              notFoundContent={
                fetchState
                  ? properties.loadingPlaceholder || 'Loading'
                  : properties.notFoundContent || 'Not found'
              }
              onChange={(newVal) => {
                methods.setValue(
                  type.isPrimitive(uniqueValueOptions[newVal])
                    ? uniqueValueOptions[newVal]
                    : uniqueValueOptions[newVal].value
                );
                methods.triggerEvent({ name: 'onChange' });
              }}
              onBlur={() => {
                methods.triggerEvent({ name: 'onBlur' });
              }}
              onFocus={() => {
                methods.triggerEvent({ name: 'onFocus' });
              }}
              onClear={() => {
                methods.triggerEvent({ name: 'onClear' });
              }}
              onSearch={async (value) => {
                setFetch(true);
                const result = await methods.triggerEvent({ name: 'onSearch', event: { value } });
                if (!result.bounced) {
                  setFetch(false);
                }
              }}
              value={getValueIndex(value, uniqueValueOptions)}
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

Selector.defaultProps = blockDefaultProps;
Selector.meta = {
  valueType: 'any',
  category: 'input',
  icons: [...Label.meta.icons],
  styles: ['blocks/Selector/style.less'],
};

export default Selector;
