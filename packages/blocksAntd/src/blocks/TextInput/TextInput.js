/*
  Copyright 2020 Lowdefy, Inc

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
import { Input } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-tools';

import Label from '../Label/Label';
import Icon from '../Icon/Icon';

const TextInput = ({ blockId, loading, methods, properties, required, validation, value }) => {
  return (
    <Label
      blockId={blockId}
      loading={loading}
      methods={methods}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      validation={validation}
      content={{
        content: () => {
          return (
            <Input
              id={`${blockId}_input`}
              className={methods.makeCssClass(properties.inputStyle)}
              autoFocus={properties.autoFocus}
              disabled={properties.disabled}
              onChange={(event) => {
                methods.setValue(event.target.value);
                methods.callAction({ action: 'onChange' });
              }}
              onPressEnter={() => {
                methods.callAction({ action: 'onPressEnter' });
              }}
              placeholder={properties.placeholder}
              value={value}
              prefix={
                properties.prefix ||
                (properties.prefixIcon && (
                  <Icon methods={methods} properties={properties.prefixIcon} />
                ))
              }
              suffix={
                properties.suffix ||
                (properties.suffixIcon && (
                  <Icon methods={methods} properties={properties.suffixIcon} />
                ))
              }
              size={properties.size}
              allowClear={properties.allowClear !== false}
            />
          );
        },
      }}
    />
  );
};

TextInput.defaultProps = blockDefaultProps;

export default TextInput;
