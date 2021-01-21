/*
  Copyright 2020-2021 Lowdefy, Inc

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
import { BlockPicker } from 'react-color';
import { Label } from '@lowdefy/blocks-antd';
import { blockDefaultProps } from '@lowdefy/block-tools';

const Selector = ({ blockId, loading, methods, properties, required, validation, value }) => {
  return (
    <Label
      blockId={blockId}
      loading={loading}
      methods={methods}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      validation={validation}
      content={{
        content: () => (
          <BlockPicker
            id={`${blockId}_input`}
            className={methods.makeCssClass([
              { marginBottom: '0px !important' },
              properties.inputStyle,
            ])}
            color={value || properties.defaultColor || '#000000'}
            colors={properties.colors}
            triangle={properties.triangle || 'hide'}
            width={properties.width || '100%'}
            onChangeComplete={(color) => {
              methods.setValue(color.hex ? color.hex : '#000000');
              methods.callAction({ action: 'onChange' });
            }}
          />
        ),
      }}
    />
  );
};

Selector.defaultProps = blockDefaultProps;

export default Selector;
