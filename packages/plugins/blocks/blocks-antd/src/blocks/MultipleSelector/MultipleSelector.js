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

import getUniqueValues from '../../getUniqueValues.js';
import getValueIndex from '../../getValueIndex.js';
import Label from '../Label/Label.js';
import Tag from '../Tag/Tag.js';

const Option = Select.Option;

const tagRender = (props, option, methods, components) => {
  const { label, closable, onClose } = props;
  return (
    <Tag
      components={components}
      methods={methods}
      onClose={onClose}
      properties={{
        title: label ?? '',
        ...(option?.tag ?? {}),
        closable,
        style: { marginRight: 3, ...(option?.tag?.style ?? {}) },
      }}
    />
  );
};

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
  const [fetchState, setFetch] = useState(false);
  const [elementId] = useState((0 | (Math.random() * 9e2)) + 1e2);
  const uniqueValueOptions = getUniqueValues(properties.options ?? []);
  return (
    <Label
      blockId={blockId}
      components={{ Icon }}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      validation={validation}
      content={{
        content: () => (
          <div className={methods.makeCssClass({ width: '100%' })}>
            <div id={`${blockId}_${elementId}_popup`} />
            <Select
              id={`${blockId}_input`}
              allowClear={properties.allowClear !== false}
              autoClearSearchValue={properties.autoClearSearchValue}
              autoFocus={properties.autoFocus}
              bordered={properties.bordered}
              className={methods.makeCssClass([{ width: '100%' }, properties.inputStyle])}
              disabled={properties.disabled || loading}
              getPopupContainer={() => document.getElementById(`${blockId}_${elementId}_popup`)}
              mode="multiple"
              tagRender={
                properties.renderTags &&
                ((props) => tagRender(props, uniqueValueOptions[props.value], methods, { Icon }))
              }
              maxTagCount={properties.maxTagCount}
              notFoundContent={
                fetchState
                  ? properties.loadingPlaceholder || 'Loading'
                  : properties.notFoundContent || 'Not found'
              }
              placeholder={
                loading ? 'Loading...' : get(properties, 'placeholder', { default: 'Select items' })
              }
              showArrow={get(properties, 'showArrow', { default: true })}
              size={properties.size}
              status={validation.status}
              value={loading ? [] : getValueIndex(value, uniqueValueOptions, true)}
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
MultipleSelector.meta = {
  valueType: 'array',
  category: 'input',
  icons: [...Label.meta.icons],
  styles: ['blocks/MultipleSelector/style.less'],
};

export default MultipleSelector;
