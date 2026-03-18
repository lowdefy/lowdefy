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

import React, { useCallback } from 'react';
import { Button, ConfigProvider, Dropdown, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { get, type } from '@lowdefy/helpers';

import { withBlockDefaults } from '@lowdefy/block-utils';
import useItemShortcuts from '../useItemShortcuts.js';

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
  const buttonType = properties.type ?? 'default';
  if (buttonType === 'danger') {
    return { color: 'danger', variant: 'solid' };
  }
  return { type: buttonType };
}

function DropdownButtonBlock({
  blockId,
  classNames = {},
  components: { Icon, ShortcutBadge },
  events,
  loading,
  methods,
  properties,
  rename,
  styles = {},
}) {
  const items = (properties.items ?? []).map((item, i) => {
    if (item.type === 'divider') {
      return { type: 'divider', key: `divider-${i}` };
    }
    return {
      key: item.eventName ?? `item-${i}`,
      label: (
        <span>
          {item.title}
          {item.shortcut && <ShortcutBadge shortcut={item.shortcut} />}
        </span>
      ),
      icon: item.icon ? (
        <Icon
          blockId={`${blockId}_icon_${i}`}
          classNames={{ element: classNames.itemIcon }}
          events={events}
          properties={item.icon}
          styles={{ element: styles.itemIcon }}
        />
      ) : undefined,
      danger: item.danger,
      disabled: item.disabled,
    };
  });

  const shortcutItems = (properties.items ?? [])
    .filter((item) => item.shortcut && item.eventName && !item.disabled)
    .map((item) => ({ key: item.eventName, shortcut: item.shortcut }));

  const onShortcutMatch = useCallback(
    (key) => {
      methods.triggerEvent({ name: key });
    },
    [methods]
  );
  useItemShortcuts({ items: shortcutItems, onMatch: onShortcutMatch });

  const onClickActionName = get(rename, 'events.onClick', { default: 'onClick' });

  const dropdownProps = {
    menu: {
      items,
      onClick: ({ key }) => methods.triggerEvent({ name: key }),
    },
    trigger: [properties.trigger ?? 'click'],
    placement: properties.placement ?? 'bottomRight',
    arrow: properties.arrow,
    disabled: properties.disabled,
    popupClassName: classNames.menu,
    popupStyle: styles.menu,
    onOpenChange: (open) =>
      methods.triggerEvent({
        name: get(rename, 'events.onOpenChange', { default: 'onOpenChange' }),
        event: { open },
      }),
  };

  const { color: buttonColor, variant, type: buttonType } = getButtonProps(properties);
  const isPresetColor = ANTD_COLOR_PRESETS.has(properties.color);
  const resolvedColor = isPresetColor ? buttonColor : properties.color ? 'primary' : buttonColor;

  const buttonIcon = properties.icon && (
    <Icon
      blockId={`${blockId}_icon`}
      classNames={{ element: classNames.icon }}
      events={events}
      properties={properties.icon}
      styles={{ element: styles.icon }}
    />
  );

  const theme = properties.theme;
  const { button: buttonTheme, ...dropdownTheme } = type.isObject(theme) ? theme : {};

  function renderContent() {
    if (properties.split) {
      return (
        <Space.Compact id={blockId} className={classNames.element} style={styles.element}>
          <Button
            color={resolvedColor}
            variant={variant}
            type={buttonType}
            size={properties.size}
            shape={properties.shape}
            ghost={properties.ghost}
            danger={properties.danger}
            disabled={properties.disabled || get(events, `${onClickActionName}.loading`) || loading}
            loading={get(events, `${onClickActionName}.loading`)}
            className={classNames.button}
            style={styles.button}
            icon={buttonIcon}
            onClick={() => methods.triggerEvent({ name: onClickActionName })}
          >
            {properties.title}
          </Button>
          <Dropdown {...dropdownProps}>
            <Button
              color={resolvedColor}
              variant={variant}
              type={buttonType}
              size={properties.size}
              ghost={properties.ghost}
              danger={properties.danger}
              disabled={properties.disabled}
              icon={<DownOutlined />}
            />
          </Dropdown>
        </Space.Compact>
      );
    }

    return (
      <Dropdown
        id={blockId}
        className={classNames.element}
        style={styles.element}
        {...dropdownProps}
      >
        <Button
          color={resolvedColor}
          variant={variant}
          type={buttonType}
          size={properties.size}
          shape={properties.shape}
          ghost={properties.ghost}
          danger={properties.danger}
          disabled={properties.disabled}
          className={classNames.button}
          style={styles.button}
          icon={buttonIcon}
        >
          {properties.title}
        </Button>
      </Dropdown>
    );
  }

  // Build ConfigProvider theme with both Dropdown and Button tokens
  const themeConfig = {};
  if (type.isObject(dropdownTheme) && Object.keys(dropdownTheme).length > 0) {
    themeConfig.Dropdown = dropdownTheme;
  }
  if (type.isObject(buttonTheme)) {
    themeConfig.Button = buttonTheme;
  }

  const hasTheme = Object.keys(themeConfig).length > 0;
  const hasCustomColor = properties.color && !isPresetColor;

  if (hasTheme || hasCustomColor) {
    const providerTheme = {};
    if (hasTheme) {
      providerTheme.components = themeConfig;
    }
    if (hasCustomColor) {
      providerTheme.token = { colorPrimary: properties.color };
    }
    return <ConfigProvider theme={providerTheme}>{renderContent()}</ConfigProvider>;
  }

  return renderContent();
}

export default withBlockDefaults(DropdownButtonBlock);
