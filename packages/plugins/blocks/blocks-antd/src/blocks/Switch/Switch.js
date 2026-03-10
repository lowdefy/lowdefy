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
import { ConfigProvider, Switch } from 'antd';
import { type, serializer } from '@lowdefy/helpers';

import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';

const SwitchBlock = ({
  blockId,
  classNames = {},
  components: { Icon, Link },
  events,
  loading,
  methods,
  properties,
  required,
  styles = {},
  validation,
  value,
}) => {
  let propertiesIconChecked = serializer.copy(properties.checkedIcon);
  if (type.isString(propertiesIconChecked)) {
    propertiesIconChecked = { name: propertiesIconChecked };
  }
  let propertiesIconUnchecked = serializer.copy(properties.uncheckedIcon);
  if (type.isString(propertiesIconUnchecked)) {
    propertiesIconUnchecked = { name: propertiesIconUnchecked };
  }
  const switchEl = (
    <Switch
      autoFocus={properties.autoFocus}
      checked={!!value}
      className={classNames.element}
      disabled={properties.disabled || loading}
      id={`${blockId}_input`}
      size={properties.size}
      style={styles.element}
      checkedChildren={
        properties.checkedText ? (
          <span>{properties.checkedText}</span>
        ) : (
          <Icon
            blockId={`${blockId}_checkedIcon`}
            events={events}
            properties={{
              name: 'AiOutlineCheck',
              ...(propertiesIconChecked || {}),
            }}
          />
        )
      }
      unCheckedChildren={
        properties.uncheckedText ? (
          <span>{properties.uncheckedText}</span>
        ) : (
          <Icon
            blockId={`${blockId}_uncheckedIcon`}
            events={events}
            properties={{
              name: 'AiOutlineClose',
              ...(propertiesIconUnchecked || {}),
            }}
          />
        )
      }
      onChange={(newVal) => {
        methods.setValue(newVal);
        methods.triggerEvent({ name: 'onChange', event: { value: newVal } });
      }}
    />
  );
  return (
    <Label
      blockId={blockId}
      classNames={classNames}
      components={{ Icon, Link }}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      styles={styles}
      validation={validation}
      content={{
        content: () =>
          properties.color ? (
            <ConfigProvider theme={{ components: { Switch: { colorPrimary: properties.color } } }}>
              {switchEl}
            </ConfigProvider>
          ) : (
            switchEl
          ),
      }}
    />
  );
};

SwitchBlock.meta = {
  valueType: 'boolean',
  category: 'input',
  icons: [...Label.meta.icons, 'AiOutlineCheck', 'AiOutlineClose'],
  cssKeys: ['element', 'label', 'extra', 'feedback'],
};

export default withTheme('Switch', SwitchBlock);
