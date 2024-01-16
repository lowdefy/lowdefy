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
import { blockDefaultProps } from '@lowdefy/block-utils';
import Label from '@lowdefy/blocks-antd/blocks/Label/Label.js';

import ColorPicker from './ColorPicker.js';

const ColorSelector = ({
  blockId,
  components,
  events,
  loading,
  methods,
  properties,
  required,
  validation,
  value,
}) => {
  return (
    <Label
      blockId={blockId}
      components={components}
      events={events}
      methods={methods}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      validation={validation}
      content={{
        content: () => (
          <ColorPicker
            id={`${blockId}_input`}
            className={methods.makeCssClass([
              { marginBottom: '0px !important' },
              properties.inputStyle,
            ])}
            onChange={(newColor) => {
              methods.setValue(newColor);
              methods.triggerEvent({ name: 'onChange' });
            }}
            size={properties.size}
            value={value}
            hideInput={properties.hideInput}
            disabled={properties.disabled || loading}
            methods={methods}
          />
        ),
      }}
    />
  );
};

ColorSelector.defaultProps = blockDefaultProps;
ColorSelector.meta = {
  valueType: 'string',
  category: 'input',
  icons: [...Label.meta.icons],
  styles: ['blocks/ColorSelector/style.less'],
};

export default ColorSelector;
