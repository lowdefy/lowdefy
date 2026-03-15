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
import { Button, ConfigProvider } from 'antd';
import { get, type } from '@lowdefy/helpers';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';

import withTheme from '../withTheme.js';

const ANTD_COLOR_PRESETS = new Set([
  'default',
  'primary',
  'danger',
  'blue',
  'purple',
  'cyan',
  'green',
  'magenta',
  'pink',
  'red',
  'orange',
  'yellow',
  'volcano',
  'geekblue',
  'lime',
  'gold',
]);

function getButtonProps(properties) {
  if (properties.variant) {
    return {
      color: properties.color,
      variant: properties.variant,
    };
  }

  const buttonType = properties.type ?? 'primary';
  if (buttonType === 'danger') {
    return { color: 'danger', variant: 'solid' };
  }
  return { type: buttonType };
}

const ButtonBlock = ({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  loading,
  methods,
  onClick,
  properties,
  rename,
  styles = {},
}) => {
  const onClickActionName = get(rename, 'events.onClick', { default: 'onClick' });
  const { color: buttonColor, variant, type: buttonType } = getButtonProps(properties);

  const isPresetColor = ANTD_COLOR_PRESETS.has(properties.color);
  const resolvedColor = isPresetColor ? buttonColor : properties.color ? 'primary' : buttonColor;

  const button = (
    <Button
      block={properties.block}
      className={classNames.element}
      style={styles.element}
      classNames={{ icon: classNames.icon }}
      styles={{ icon: styles.icon }}
      color={resolvedColor}
      variant={variant}
      type={buttonType}
      disabled={properties.disabled || get(events, `${onClickActionName}.loading`) || loading}
      ghost={properties.ghost}
      danger={properties.danger}
      href={properties.href}
      id={blockId}
      loading={get(events, `${onClickActionName}.loading`)}
      shape={properties.shape}
      size={properties.size}
      icon={
        properties.icon && (
          <Icon
            blockId={`${blockId}_icon`}
            classNames={{ element: classNames.icon }}
            events={events}
            properties={properties.icon}
            styles={{ element: styles.icon }}
          />
        )
      }
      onClick={onClick || (() => methods.triggerEvent({ name: onClickActionName }))}
    >
      {!properties.hideTitle &&
        !(properties.shape === 'circle' && type.isNone(properties.title)) &&
        renderHtml({
          html: type.isNone(properties.title) ? blockId : properties.title,
          methods,
        })}
    </Button>
  );

  if (properties.color && !isPresetColor) {
    return (
      <ConfigProvider theme={{ token: { colorPrimary: properties.color } }}>
        {button}
      </ConfigProvider>
    );
  }
  return button;
};

export default withTheme('Button', withBlockDefaults(ButtonBlock));
