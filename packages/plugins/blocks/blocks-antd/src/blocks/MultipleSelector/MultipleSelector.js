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
import { Select } from 'antd';

import filterSelectorOption from '../../filterSelectorOption.js';
import getContrastTextColor from '../../getContrastTextColor.js';
import getOptionColorStyle from '../../getOptionColorStyle.js';
import getSelectedIndex from '../../getSelectedIndex.js';
import getSelectOptions from '../../getSelectOptions.js';
import useSelectorOptions from '../../useSelectorOptions.js';
import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';
import Tag from '../Tag/Tag.js';

const tagRender = (props, option, methods, components, isOutline) => {
  const { label, closable, onClose } = props;
  // An explicit tag.color wins; otherwise the per-option color drives the pill.
  const color = option?.tag?.color ?? option?.color;
  const contrast = getContrastTextColor(color);
  // Hex color → explicit solid/outlined pill (dark-mode safe), following the
  // input variant. Preset name (or none) → antd's Tag color handling.
  const colorStyle = contrast ? getOptionColorStyle({ color, isOutline }) : {};
  return (
    <Tag
      components={components}
      methods={methods}
      onClose={onClose}
      styles={{ element: { marginRight: 3, ...colorStyle, ...(option?.tag?.style ?? {}) } }}
      properties={{
        title: label ?? '',
        ...(option?.tag ?? {}),
        color: contrast ? undefined : color,
        closable,
      }}
    />
  );
};

const MultipleSelector = ({
  blockId,
  classNames = {},
  components: { Icon, ShortcutBadge },
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
  // Auto-enable custom tag rendering when any option carries a color/tag, so
  // per-option pill colors work without requiring renderTags.
  const hasTagStyling = uniqueValueOptions.some(
    (opt) => !type.isPrimitive(opt) && (opt.color || opt.tag)
  );
  // `outlined` → outlined colored tags; `solid` (or default) → filled colored tags.
  const isOutline = properties.variant === 'outlined';
  // `solid` is not a valid antd Select input variant — use outlined for the frame.
  let antdVariant = properties.variant;
  if (properties.variant === 'solid') antdVariant = 'outlined';
  if (properties.bordered === false) antdVariant = 'borderless';
  // antd only shows its loading indicator when no suffixIcon is passed, so swap ours for a spinner.
  let suffixIcon = null;
  if (loading) {
    suffixIcon = (
      <Icon
        blockId={`${blockId}_loadingIcon`}
        properties={{ name: 'loading', spin: true, title: '' }}
      />
    );
  } else if (get(properties, 'showArrow', { default: true }) !== false) {
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
    autoClearSearchValue: properties.autoClearSearchValue,
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
      components={{ Icon }}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      styles={styles}
      validation={validation}
      content={{
        content: () => (
          <div style={{ width: '100%' }}>
            <div id={`${blockId}_${elementId}_popup`} />
            <Select
              id={`${blockId}_input`}
              autoFocus={properties.autoFocus}
              variant={antdVariant}
              className={classNames.element}
              classNames={{ content: classNames.selector, popup: { root: classNames.popup } }}
              style={{ width: '100%', ...styles.element }}
              styles={{ content: styles.selector, popup: { root: styles.popup } }}
              disabled={properties.disabled || loading}
              getPopupContainer={() => document.getElementById(`${blockId}_${elementId}_popup`)}
              listHeight={properties.listHeight}
              loading={loading}
              mode="multiple"
              tagRender={
                (properties.renderTags || hasTagStyling) &&
                ((props) =>
                  tagRender(
                    props,
                    uniqueValueOptions[props.value],
                    methods,
                    { Icon, ShortcutBadge },
                    isOutline
                  ))
              }
              maxCount={properties.maxCount}
              maxTagCount={properties.maxTagCount}
              notFoundContent={
                fetchState
                  ? properties.loadingPlaceholder || 'Loading'
                  : properties.notFoundContent || 'Not found'
              }
              placeholder={
                loading ? 'Loading...' : get(properties, 'placeholder', { default: 'Select items' })
              }
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
              showSearch={showSearch}
              // antd 6 names the default size `medium`; `default` is not an antd size.
              size={properties.size === 'default' ? 'medium' : properties.size}
              status={validation.status}
              value={
                loading
                  ? []
                  : getSelectedIndex(value, uniqueValueOptions, { properties, multiple: true })
              }
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
              menuItemSelectedIcon={
                <Icon
                  blockId={`${blockId}_selectedIcon`}
                  classNames={{ element: classNames.selectedIcon }}
                  events={events}
                  properties={properties.selectedIcon ?? { name: 'check', title: '' }}
                  styles={{ element: styles.selectedIcon }}
                />
              }
              removeIcon={
                <Icon
                  blockId={`${blockId}_removeIcon`}
                  classNames={{ element: classNames.removeIcon }}
                  events={events}
                  properties={properties.removeIcon ?? { name: 'close', title: '' }}
                  styles={{ element: styles.removeIcon }}
                />
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
              // An undefined `virtual` would override ConfigProvider's, so pass it only when set.
              {...(type.isNone(properties.virtual) ? {} : { virtual: properties.virtual })}
            />
          </div>
        ),
      }}
    />
  );
};

export default withTheme('Select', withBlockDefaults(MultipleSelector));
