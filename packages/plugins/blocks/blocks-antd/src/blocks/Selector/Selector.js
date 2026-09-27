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
import { withBlockDefaults } from '@lowdefy/block-utils';
import { get, type } from '@lowdefy/helpers';
import { ConfigProvider, Select } from 'antd';

import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';
import filterSelectorOption from '../../filterSelectorOption.js';
import getContrastTextColor from '../../getContrastTextColor.js';
import getSelectedIndex from '../../getSelectedIndex.js';
import getSelectOptions from '../../getSelectOptions.js';
import useSelectorOptions from '../../useSelectorOptions.js';

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
  // antd only shows its loading indicator when no suffixIcon is passed, so swap ours for a spinner.
  let suffixIcon = null;
  if (loading) {
    suffixIcon = (
      <Icon
        blockId={`${blockId}_loadingIcon`}
        properties={{ name: 'loading', spin: true, title: '' }}
      />
    );
  } else if (properties.showArrow !== false) {
    suffixIcon = (
      <Icon
        blockId={`${blockId}_suffixIcon`}
        classNames={{ element: classNames.suffixIcon }}
        events={events}
        properties={properties.suffixIcon ?? { name: 'chevron-down', title: '' }}
        styles={{ element: styles.suffixIcon }}
      />
    );
  }
  const showSearch = get(properties, 'showSearch', { default: true }) && {
    filterOption: filterSelectorOption,
    onSearch: async (searchValue) => {
      setFetch(true);
      const result = await methods.triggerEvent({
        name: 'onSearch',
        event: { value: searchValue },
      });
      if (!result.bounced) {
        setFetch(false);
      }
    },
  };
  return (
    <Label
      blockId={blockId}
      methods={methods}
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
                classNames={{ content: classNames.selector, popup: { root: classNames.popup } }}
                style={{ width: '100%', ...styles.element }}
                styles={{ content: styles.selector, popup: { root: styles.popup } }}
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
                listHeight={properties.listHeight}
                loading={loading}
                placeholder={get(properties, 'placeholder', { default: 'Select item' })}
                placement={properties.placement}
                popupMatchSelectWidth={properties.popupMatchSelectWidth}
                prefix={
                  properties.prefix ??
                  (properties.prefixIcon && (
                    <Icon
                      blockId={`${blockId}_prefixIcon`}
                      classNames={{ element: classNames.prefixIcon }}
                      events={events}
                      properties={properties.prefixIcon}
                      styles={{ element: styles.prefixIcon }}
                    />
                  ))
                }
                status={validation.status}
                suffixIcon={suffixIcon}
                allowClear={
                  properties.allowClear !== false && {
                    clearIcon: (
                      <Icon
                        blockId={`${blockId}_clearIcon`}
                        classNames={{ element: classNames.clearIcon }}
                        events={events}
                        properties={properties.clearIcon ?? { name: 'clear', title: '' }}
                        styles={{ element: styles.clearIcon }}
                      />
                    ),
                  }
                }
                showSearch={showSearch}
                // antd 6 names the default size `medium`; `default` is not an antd size.
                size={properties.size === 'default' ? 'medium' : properties.size}
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
                onOpenChange={(open) => {
                  methods.triggerEvent({ name: 'onOpenChange', event: { open } });
                }}
                options={getSelectOptions({
                  blockId,
                  classNames,
                  entries: uniqueValueOptions,
                  methods,
                  styles,
                })}
                value={selectedIndex}
                // An undefined `virtual` would override ConfigProvider's, so pass it only when set.
                {...(type.isNone(properties.virtual) ? {} : { virtual: properties.virtual })}
              />
            </ConfigProvider>
          </div>
        ),
      }}
    />
  );
};

export default withTheme('Select', withBlockDefaults(Selector));
