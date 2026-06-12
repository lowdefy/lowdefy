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

import React, { useState } from 'react';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { get, type } from '@lowdefy/helpers';
import { ConfigProvider, Select } from 'antd';

import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';
import getSelectedIndex from '../../getSelectedIndex.js';
import useSelectorOptions from '../../useSelectorOptions.js';
import getContrastTextColor from '../../getContrastTextColor.js';

const Option = Select.Option;

const Selector = ({
  blockId,
  classNames = {},
  components: { Icon, Link },
  events,
  loading,
  methods,
  properties,
  required,
  styles = {},
  validation,
  value,
}) => {
  const [fetchState, setFetch] = useState(false);
  const [elementId] = useState((0 | (Math.random() * 9e2)) + 1e2);
  const uniqueValueOptions = useSelectorOptions({ properties, methods });
  // Color the whole selector with the selected option's color: `solid` fills the
  // input, otherwise the border/text is colored.
  const selectedIndex = getSelectedIndex(value, uniqueValueOptions, { properties });
  const selectedOption = type.isNone(selectedIndex) ? undefined : uniqueValueOptions[selectedIndex];
  const selectedColor = type.isObject(selectedOption) ? selectedOption.color : undefined;
  const isSolid = properties.variant === 'solid';
  // `solid` is not a valid antd Select input variant — use outlined for the frame.
  let antdVariant = properties.variant;
  if (isSolid) antdVariant = 'outlined';
  if (properties.bordered === false) antdVariant = 'borderless';
  let selectTheme;
  if (selectedColor) {
    const token = { colorPrimary: selectedColor, colorBorder: selectedColor };
    if (isSolid) token.colorBgContainer = selectedColor;
    selectTheme = { token };
  }
  return (
    <Label
      blockId={blockId}
      classNames={classNames}
      components={{ Icon, Link }}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      styles={styles}
      content={{
        content: () => (
          <div style={{ width: '100%' }}>
            <div id={`${blockId}_${elementId}_popup`} />
            <ConfigProvider theme={selectTheme}>
              <Select
                id={`${blockId}_input`}
                variant={antdVariant}
                className={classNames.element}
                classNames={{ content: classNames.selector }}
                style={{ width: '100%', ...styles.element }}
                styles={{ content: styles.selector }}
                mode="single"
                labelRender={(labelProps) => {
                  const opt = uniqueValueOptions[labelProps.value];
                  const color = type.isPrimitive(opt) ? undefined : opt?.color;
                  if (type.isNone(color)) return labelProps.label;
                  const textColor = isSolid ? getContrastTextColor(color) ?? '#fff' : color;
                  return <span style={{ color: textColor }}>{labelProps.label}</span>;
                }}
                autoFocus={properties.autoFocus}
                getPopupContainer={() => document.getElementById(`${blockId}_${elementId}_popup`)}
                disabled={properties.disabled || loading}
                placeholder={get(properties, 'placeholder', { default: 'Select item' })}
                status={validation.status}
                suffixIcon={
                  properties.suffixIcon && (
                    <Icon
                      blockId={`${blockId}_suffixIcon`}
                      classNames={{ element: classNames.suffixIcon }}
                      events={events}
                      properties={properties.suffixIcon}
                      styles={{ element: styles.suffixIcon }}
                    />
                  )
                }
                clearIcon={
                  properties.clearIcon && (
                    <Icon
                      blockId={`${blockId}_clearIcon`}
                      classNames={{ element: classNames.clearIcon }}
                      events={events}
                      properties={properties.clearIcon}
                      styles={{ element: styles.clearIcon }}
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
                  const val = type.isPrimitive(uniqueValueOptions[newVal])
                    ? uniqueValueOptions[newVal]
                    : uniqueValueOptions[newVal].value;
                  methods.setValue(val);
                  methods.triggerEvent({ name: 'onChange', event: { value: val } });
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
                value={getSelectedIndex(value, uniqueValueOptions, { properties })}
              >
                {uniqueValueOptions.map((opt, i) =>
                  type.isPrimitive(opt) ? (
                    <Option
                      style={styles.options}
                      className={classNames.options}
                      id={`${blockId}_${i}`}
                      key={i}
                      value={`${i}`}
                    >
                      {renderHtml({ html: `${opt}`, methods })}
                    </Option>
                  ) : (
                    <Option
                      style={{
                        ...styles.options,
                        ...opt.style,
                        ...(opt.color ? { color: opt.color } : {}),
                      }}
                      className={classNames.options}
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
            </ConfigProvider>
          </div>
        ),
      }}
    />
  );
};

export default withTheme('Select', withBlockDefaults(Selector));
