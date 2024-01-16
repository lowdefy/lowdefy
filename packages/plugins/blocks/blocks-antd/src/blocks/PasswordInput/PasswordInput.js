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
import { Input } from 'antd';
import { blockDefaultProps } from '@lowdefy/block-utils';

import Label from '../Label/Label.js';
import useRunAfterUpdate from '../../useRunAfterUpdate.js';

const PasswordInput = ({
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
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      validation={validation}
      content={{
        content: () => {
          const runAfterUpdate = useRunAfterUpdate();
          return (
            <Input.Password
              id={`${blockId}_input`}
              bordered={properties.bordered}
              className={methods.makeCssClass(properties.inputStyle)}
              autoFocus={properties.autoFocus}
              disabled={properties.disabled || loading}
              onChange={(event) => {
                methods.setValue(event.target.value);
                methods.triggerEvent({ name: 'onChange' });
                const cStart = event.target.selectionStart;
                const cEnd = event.target.selectionEnd;
                runAfterUpdate(() => {
                  event.target.setSelectionRange(cStart, cEnd);
                });
              }}
              onPressEnter={() => {
                methods.triggerEvent({ name: 'onPressEnter' });
              }}
              onFocus={() => {
                methods.triggerEvent({ name: 'onFocus' });
              }}
              onBlur={() => {
                methods.triggerEvent({ name: 'onBlur' });
              }}
              placeholder={properties.placeholder}
              value={value}
              size={properties.size}
              status={validation.status}
              visibilityToggle={properties.visibilityToggle}
            />
          );
        },
      }}
    />
  );
};

PasswordInput.defaultProps = blockDefaultProps;
PasswordInput.meta = {
  valueType: 'string',
  category: 'input',
  icons: [...Label.meta.icons],
  styles: ['blocks/PasswordInput/style.less'],
};

export default PasswordInput;
