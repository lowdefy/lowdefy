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
import { InputNumber } from 'antd';
import { getLocaleDecimalSeparator } from '@lowdefy/helpers';

import { withBlockDefaults } from '@lowdefy/block-utils';
import getDisabled from '../../getDisabled.js';
import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';

const NumberInput = ({
  blockId,
  classNames = {},
  events,
  components,
  loading,
  methods,
  properties,
  required,
  styles = {},
  validation,
  value,
}) => {
  const isSpinner = properties.mode === 'spinner';
  return (
    <Label
      blockId={blockId}
      methods={methods}
      classNames={classNames}
      components={components}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      styles={styles}
      validation={validation}
      content={{
        content: () => (
          <InputNumber
            id={`${blockId}_input`}
            autoComplete="off"
            autoFocus={properties.autoFocus}
            changeOnWheel={properties.changeOnWheel}
            variant={properties.bordered === false ? 'borderless' : properties.variant ?? undefined}
            className={classNames.element}
            style={{ width: '100%', ...styles.element }}
            controls={
              properties.controls !== false && {
                upIcon: (
                  <components.Icon
                    blockId={`${blockId}_upIcon`}
                    properties={{ name: isSpinner ? 'add' : 'chevron-up', title: '' }}
                  />
                ),
                downIcon: (
                  <components.Icon
                    blockId={`${blockId}_downIcon`}
                    properties={{ name: isSpinner ? 'minus' : 'chevron-down', title: '' }}
                  />
                ),
              }
            }
            decimalSeparator={
              properties.decimalSeparator ?? getLocaleDecimalSeparator(methods.getLocale?.()) ?? '.'
            }
            disabled={getDisabled({ loading, properties })}
            formatter={properties.formatter}
            keyboard={properties.keyboard}
            max={properties.max}
            min={properties.min}
            mode={properties.mode ?? undefined}
            parser={properties.parser}
            placeholder={properties.placeholder}
            precision={properties.precision ?? undefined}
            prefix={
              properties.prefix ||
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
            size={properties.size}
            status={validation.status}
            step={properties.step ?? undefined}
            suffix={
              (properties.suffix || properties.suffixIcon) && (
                <>
                  {properties.suffix && properties.suffix}
                  {properties.suffixIcon && (
                    <components.Icon
                      blockId={`${blockId}_suffixIcon`}
                      classNames={{ element: classNames.suffixIcon }}
                      events={events}
                      properties={properties.suffixIcon}
                      styles={{ element: styles.suffixIcon }}
                    />
                  )}
                </>
              )
            }
            onChange={(newVal) => {
              methods.setValue(newVal);
              methods.triggerEvent({ name: 'onChange', event: { value: newVal } });
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
            value={value}
          />
        ),
      }}
    />
  );
};

export default withTheme('InputNumber', withBlockDefaults(NumberInput));
