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
import { Checkbox, ConfigProvider, Space } from 'antd';
import { renderHtml } from '@lowdefy/block-utils';

import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';

const CheckboxSwitch = ({
  blockId,
  classNames = {},
  components,
  events,
  loading,
  properties,
  required,
  styles = {},
  validation,
  value,
  methods,
}) => {
  const checkbox = (
    <Checkbox
      id={`${blockId}_input`}
      checked={value}
      className={classNames.element}
      disabled={properties.disabled || loading}
      style={{
        marginRight: properties.description ? '30px' : undefined,
        ...styles.element,
      }}
      onChange={(e) => {
        methods.setValue(e.target.checked);
        methods.triggerEvent({ name: 'onChange', event: { value: e.target.checked } });
      }}
    >
      <Space wrap={true}>{renderHtml({ html: properties.description, methods })}</Space>
    </Checkbox>
  );
  return (
    <Label
      blockId={blockId}
      classNames={classNames}
      components={components}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      validation={validation}
      required={required}
      styles={styles}
      content={{
        content: () =>
          properties.color ? (
            <ConfigProvider
              theme={{ components: { Checkbox: { colorPrimary: properties.color } } }}
            >
              {checkbox}
            </ConfigProvider>
          ) : (
            checkbox
          ),
      }}
    />
  );
};

CheckboxSwitch.meta = {
  valueType: 'boolean',
  category: 'input',
  icons: [...Label.meta.icons],
  cssKeys: ['element', 'label', 'extra', 'feedback'],
};

export default withTheme('Checkbox', CheckboxSwitch);
