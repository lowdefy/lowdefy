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
import { ColorPicker } from 'antd';
import { type } from '@lowdefy/helpers';

import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';

const ColorPickerInput = ({
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
      components={components}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      content={{
        content: () => (
          <ColorPicker
            id={`${blockId}_input`}
            className={classNames.element}
            style={styles.element}
            value={type.isNone(value) ? undefined : value}
            defaultValue={properties.defaultValue}
            format={properties.format}
            showText={properties.showText}
            size={properties.size}
            disabled={properties.disabled || loading}
            allowClear={properties.allowClear}
            presets={properties.presets}
            trigger={properties.trigger}
            onChange={(color) => {
              const hexValue = color.toHexString();
              methods.setValue(hexValue);
              methods.triggerEvent({ name: 'onChange', event: { value: hexValue } });
            }}
            onOpenChange={(open) => {
              methods.triggerEvent({ name: 'onOpenChange', event: { open } });
            }}
          />
        ),
      }}
    />
  );
};

ColorPickerInput.meta = {
  valueType: 'string',
  category: 'input',
  icons: [...Label.meta.icons],
  cssKeys: ['element'],
};

export default withTheme('ColorPicker', ColorPickerInput);
