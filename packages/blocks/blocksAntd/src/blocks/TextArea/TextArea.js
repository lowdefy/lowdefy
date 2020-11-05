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
import { type } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-tools';
import { Input } from 'antd';
import Label from '../Label/Label';

const TextAreaComp = Input.TextArea;

const TextAreaBlock = ({ blockId, loading, properties, required, validate, value, methods }) => {
  return (
    <Label
      blockId={blockId}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validate={validate}
      required={required}
      loading={loading}
      methods={methods}
      content={{
        content: () => {
          return (
            <TextAreaComp
              id={`${blockId}_input`}
              className={methods.makeCssClass(properties.inputStyle)}
              disabled={properties.disabled}
              autoFocus={properties.autoFocus}
              onChange={(event) => {
                methods.setValue(event.target.value);
                methods.callAction({ action: 'onChange' });
              }}
              onPressEnter={() => {
                methods.callAction({ action: 'onPressEnter' });
              }}
              placeholder={properties.placeholder}
              value={value}
              allowClear={properties.allowClear !== false}
              autoSize={
                properties.rows
                  ? { minRows: properties.rows, maxRows: properties.rows }
                  : type.isNone(properties.autoSize)
                  ? { minRows: 3 }
                  : properties.autoSize
              }
            />
          );
        },
      }}
    />
  );
};

TextAreaBlock.defaultProps = blockDefaultProps;

export default TextAreaBlock;
