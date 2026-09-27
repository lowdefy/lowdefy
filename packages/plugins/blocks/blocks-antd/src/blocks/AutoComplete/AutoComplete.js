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

import React from 'react';
import { AutoComplete } from 'antd';
import { type } from '@lowdefy/helpers';

import { withBlockDefaults } from '@lowdefy/block-utils';
import getDisabled from '../../getDisabled.js';
import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';

const AutoCompleteInput = ({
  blockId,
  classNames = {},
  components,
  events,
  loading,
  methods,
  properties,
  required,
  styles = {},
  validation,
  value,
}) => {
  return (
    <Label
      blockId={blockId}
      methods={methods}
      classNames={classNames}
      components={components}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      styles={styles}
      content={{
        content: () => (
          <AutoComplete
            id={`${blockId}_input`}
            autoFocus={properties.autoFocus}
            backfill={properties.backfill}
            variant={properties.bordered === false ? 'borderless' : properties.variant}
            className={classNames.element}
            classNames={{ content: classNames.selector, popup: { root: classNames.popup } }}
            style={{ width: '100%', ...styles.element }}
            styles={{ content: styles.selector, popup: { root: styles.popup } }}
            defaultOpen={properties.defaultOpen}
            disabled={getDisabled({ loading, properties })}
            placeholder={properties.placeholder ?? 'Type or select item'}
            allowClear={
              properties.allowClear !== false && {
                clearIcon: (
                  <components.Icon
                    blockId={`${blockId}_clearIcon`}
                    properties={{ name: 'clear', title: '' }}
                  />
                ),
              }
            }
            listHeight={properties.listHeight}
            placement={properties.placement}
            popupMatchSelectWidth={properties.popupMatchSelectWidth}
            // antd 6 names the default size `medium`; `default` is not an antd size.
            size={properties.size === 'default' ? 'medium' : properties.size}
            status={validation.status}
            options={(properties.options ?? []).map((opt, i) => ({
              className: classNames.options,
              id: `${blockId}_${i}`,
              key: i,
              label: `${opt}`,
              style: styles.options,
              value: `${opt}`,
            }))}
            prefix={
              properties.prefix ??
              (properties.prefixIcon && (
                <components.Icon
                  blockId={`${blockId}_prefixIcon`}
                  classNames={{ element: classNames.prefixIcon }}
                  events={events}
                  properties={properties.prefixIcon}
                  styles={{ element: styles.prefixIcon }}
                />
              ))
            }
            showSearch={{
              filterOption: (input, option) =>
                `${option.value}`.toLowerCase().indexOf(input.toLowerCase()) >= 0,
              onSearch: (newVal) => {
                methods.triggerEvent({ name: 'onSearch', event: { value: newVal } });
              },
            }}
            onChange={(newVal) => {
              methods.setValue(newVal);
              methods.triggerEvent({ name: 'onChange', event: { value: newVal } });
            }}
            onFocus={() => {
              methods.triggerEvent({ name: 'onFocus' });
            }}
            onBlur={() => {
              methods.triggerEvent({ name: 'onBlur' });
            }}
            onClear={() => {
              methods.triggerEvent({ name: 'onClear' });
            }}
            onOpenChange={(open) => {
              methods.triggerEvent({ name: 'onOpenChange', event: { open } });
            }}
            onSelect={(newVal) => {
              methods.triggerEvent({ name: 'onSelect', event: { value: newVal } });
            }}
            value={type.isNone(value) ? undefined : `${value}`}
            // antd lets even an undefined `virtual` prop override the ConfigProvider `virtual`.
            {...(type.isNone(properties.virtual) ? {} : { virtual: properties.virtual })}
          />
        ),
      }}
    />
  );
};

export default withTheme('Select', withBlockDefaults(AutoCompleteInput));
