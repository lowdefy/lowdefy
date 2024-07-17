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

import React from 'react';
import { Input, Select } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-utils';
import regions from './regions.js';

import Label from '../Label/Label.js';
import getValueIndex from '../../getValueIndex.js';
import getUniqueValues from '../../getUniqueValues.js';

const Option = Select.Option;

function getAllowedRegions({ allowedRegions, regions }) {
  if (!allowedRegions || allowedRegions.length === 0) {
    return regions;
  }

  return regions.filter((region) => allowedRegions.includes(region.code));
}

function getDefaultRegion({ allowedRegions, defaultRegion, uniqueValueOptions }) {
  if (!defaultRegion) {
    return getValueIndex(allowedRegions[0], uniqueValueOptions);
  }

  const index = allowedRegions.findIndex((region) => region.code === defaultRegion);

  if (index === -1) {
    return getValueIndex(allowedRegions[0], uniqueValueOptions);
  }

  return getValueIndex(allowedRegions[index], uniqueValueOptions);
}

function AddOnSelect({
  blockId,
  defaultValue,
  loading,
  methods,
  properties,
  uniqueValueOptions,
  value,
}) {
  return (
    <Select
      id={`${blockId}_select_input`}
      bordered={properties.bordered}
      className={methods.makeCssClass([
        { minWidth: 100 },
        methods.makeCssClass(properties.selectStyle),
      ])}
      defaultValue={defaultValue}
      disabled={properties.disabled || loading}
      dropdownMatchSelectWidth={false}
      filterOption={(input, option) =>
        option.filterString.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
      mode="single"
      notFoundContent={'Not found'}
      onChange={(newVal) => {
        const input = value?.input ?? '';
        const region = uniqueValueOptions[newVal]?.value ?? {};
        const phone_number = `${region?.dial_code ?? ''}${input}`;

        methods.setValue({
          input,
          region,
          phone_number,
        });

        methods.triggerEvent({ name: 'onCodeChange' });
        methods.triggerEvent({ name: 'onChange' });
      }}
      onBlur={() => {
        methods.triggerEvent({ name: 'onBlur' });
      }}
      onFocus={() => {
        methods.triggerEvent({ name: 'onFocus' });
      }}
      optionFilterProp="filterString"
      optionLabelProp="label"
      placeholder={'Select item'}
      showArrow={properties.showArrow}
      showSearch={true}
      size={properties.size}
      value={getValueIndex(value?.region, uniqueValueOptions)}
    >
      {uniqueValueOptions.map((opt, i) => {
        const displayLabel =
          properties.showFlags === false
            ? `${opt.value.name} ${opt.value.dial_code}`
            : `${opt.value.flag} ${opt.value.name} ${opt.value.dial_code}`;
        return (
          <Option
            className={methods.makeCssClass([properties.optionsStyle])}
            filterString={displayLabel}
            id={`${blockId}_${i}`}
            key={`${i}`}
            value={`${i}`}
            label={opt.label}
          >
            {displayLabel}
          </Option>
        );
      })}
    </Select>
  );
}

const PhoneNumberInput = ({
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
  const allowedRegions = getAllowedRegions({ allowedRegions: properties.allowedRegions, regions });

  const uniqueValueOptions = getUniqueValues(
    allowedRegions.map((region) => ({
      value: {
        ...region,
      },
      label:
        properties.showFlags === false
          ? `${region.dial_code}`
          : `${region.flag} ${region.dial_code}`,
    }))
  );

  const defaultValue = getDefaultRegion({
    allowedRegions,
    defaultRegion: properties.defaultRegion,
    methods,
    uniqueValueOptions,
  });

  if (value === null) {
    methods.setValue({
      input: '',
      region: allowedRegions[defaultValue],
      phone_number: allowedRegions[defaultValue].dial_code,
    });
  }

  return (
    <Label
      blockId={blockId}
      components={{ Icon, Link }}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      validation={validation}
      content={{
        content: () => {
          return (
            <Input
              id={`${blockId}_input`}
              addonBefore={
                <AddOnSelect
                  blockId={blockId}
                  defaultValue={defaultValue}
                  loading={loading}
                  methods={methods}
                  properties={properties}
                  uniqueValueOptions={uniqueValueOptions}
                  value={value}
                />
              }
              allowClear={properties.allowClear}
              autoFocus={properties.autoFocus}
              bordered={properties.bordered}
              className={`ldf-phone-number-input ${methods.makeCssClass(properties.inputStyle)}`}
              disabled={properties.disabled || loading}
              maxLength={properties.maxLength}
              placeholder={properties.placeholder}
              size={properties.size}
              status={validation.status}
              value={value?.input}
              onChange={(event) => {
                let input = event.target.value;

                if (properties.replaceInput) {
                  const regex = new RegExp(
                    properties.replaceInput.pattern,
                    properties.replaceInput.flags ?? 'gm'
                  );
                  input = input.replace(regex, properties.replaceInput.replacement ?? '');
                }

                const region = value?.region ?? {};
                const phone_number = `${region?.dial_code ?? ''}${input}`;

                methods.setValue({
                  input,
                  region,
                  phone_number,
                });

                methods.triggerEvent({ name: 'onInputChange' });
                methods.triggerEvent({ name: 'onChange' });
              }}
              onPressEnter={() => {
                methods.triggerEvent({ name: 'onPressEnter' });
              }}
              onBlur={() => {
                methods.triggerEvent({ name: 'onBlur' });
              }}
              onFocus={() => {
                methods.triggerEvent({ name: 'onFocus' });
              }}
              prefix={
                properties.prefix ||
                (properties.prefixIcon && (
                  <Icon
                    blockId={`${blockId}_prefixIcon`}
                    events={events}
                    properties={properties.prefixIcon}
                  />
                ))
              }
              suffix={
                (properties.suffix || properties.suffixIcon) && (
                  <>
                    {properties.suffix && properties.suffix}
                    {properties.suffixIcon && (
                      <Icon
                        blockId={`${blockId}_suffixIcon`}
                        events={events}
                        properties={properties.suffixIcon}
                      />
                    )}
                  </>
                )
              }
            />
          );
        },
      }}
    />
  );
};

PhoneNumberInput.defaultProps = blockDefaultProps;
PhoneNumberInput.meta = {
  valueType: 'object',
  category: 'input',
  icons: [...Label.meta.icons],
  styles: ['blocks/PhoneNumberInput/style.less'],
};

export default PhoneNumberInput;
