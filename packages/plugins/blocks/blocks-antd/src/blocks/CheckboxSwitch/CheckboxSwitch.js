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
import { Checkbox, Space } from 'antd';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';

import Label from '../Label/Label.js';

const CheckboxSwitch = ({
  blockId,
  components,
  events,
  loading,
  properties,
  required,
  validation,
  value,
  methods,
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
          <Checkbox
            id={`${blockId}_input`}
            checked={value}
            disabled={properties.disabled || loading}
            className={methods.makeCssClass([
              properties.color && {
                '& > span.ant-checkbox-checked:not(.ant-checkbox-disabled) > span': {
                  backgroundColor: `${properties.color} !important`,
                  borderColor: `${properties.color} !important`,
                },
              },
              properties.description && {
                marginRight: '30px', // stops the checkbox description from overlapping with the validation symbol
              },
              properties.inputStyle,
            ])}
            onChange={(e) => {
              methods.setValue(e.target.checked);
              methods.triggerEvent({ name: 'onChange' });
            }}
          >
            <Space wrap={true}>{renderHtml({ html: properties.description, methods })}</Space>
          </Checkbox>
        ),
      }}
    />
  );
};

CheckboxSwitch.defaultProps = blockDefaultProps;
CheckboxSwitch.meta = {
  valueType: 'boolean',
  category: 'input',
  icons: [...Label.meta.icons],
  styles: ['blocks/CheckboxSwitch/style.less'],
};

export default CheckboxSwitch;
