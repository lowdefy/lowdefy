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
import { get, type } from '@lowdefy/helpers';

import { cn, withBlockDefaults } from '@lowdefy/block-utils';
import getDisabled from '../../getDisabled.js';
import useDisabled from '../../useDisabled.js';
import useItemShortcuts from '../useItemShortcuts.js';
import getDropdownMenuIcons from '../getDropdownMenuIcons.js';

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
    const eventShortcut = item.eventName ? events[item.eventName]?.shortcut : undefined;
    const itemShortcut = eventShortcut ?? item.shortcut;
    return {
      key: item.eventName ?? `item-${i}`,
      label: (
        <span>
          {item.title}
          {itemShortcut && <ShortcutBadge shortcut={itemShortcut} />}
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

  // Item-level shortcut fallback for items that declare `shortcut` on properties
  // rather than via `events.<eventName>.shortcut`. Skip items whose event already
  // owns the shortcut — the framework-level shortcut manager handles those.
  const propertyShortcutItems = (properties.items ?? [])
    .filter(
      (item) =>
        item.shortcut && item.eventName && !item.disabled && !events[item.eventName]?.shortcut
    )
    .map((item) => ({ key: item.eventName, shortcut: item.shortcut }));

  const onShortcutMatch = useCallback(
    (key) => {
      methods.triggerEvent({ name: key });
    },
    [methods]
  );
  useItemShortcuts({ items: propertyShortcutItems, onMatch: onShortcutMatch });

  const onClickActionName = get(rename, 'events.onClick', { default: 'onClick' });
  const onClickShortcut = events[onClickActionName]?.shortcut;
  const actionLoading = get(events, `${onClickActionName}.loading`);
  // antd Dropdown doesn't read ConfigProvider componentDisabled, so a hover trigger would still
  // open the menu of a button disabled by context.
  const dropdownDisabled = useDisabled({ properties });

  const dropdownProps = {
    menu: {
      ...getDropdownMenuIcons({ blockId, Icon }),
      items,
      onClick: ({ key }) => methods.triggerEvent({ name: key }),
    },
    trigger: [properties.trigger ?? 'click'],
    placement: properties.placement ?? 'bottomRight',
    arrow: properties.arrow,
    disabled: dropdownDisabled,
    classNames: { root: classNames.menu, item: classNames.item },
    styles: { root: styles.menu, item: styles.item },
    onOpenChange: (open) =>
      methods.triggerEvent({
        name: get(rename, 'events.onOpenChange', { default: 'onOpenChange' }),
        event: { open },
      }),
  };

  const { color: buttonColor, variant, type: buttonType } = getButtonProps(properties);
  // antd 6 deprecates the `middle` size in favour of `medium`.
  const buttonSize = properties.size === 'middle' ? 'medium' : properties.size;
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
            size={buttonSize}
            shape={properties.shape}
            ghost={properties.ghost}
            danger={properties.danger}
            disabled={getDisabled({ loading: actionLoading || loading, properties })}
            loading={actionLoading}
            className={classNames.button}
            style={styles.button}
            icon={buttonIcon}
            iconPlacement={properties.iconPlacement}
            onClick={() => methods.triggerEvent({ name: onClickActionName })}
          >
            {properties.title}
            {onClickShortcut && <ShortcutBadge shortcut={onClickShortcut} />}
          </Button>
          <Dropdown {...dropdownProps}>
            <Button
              color={resolvedColor}
              variant={variant}
              type={buttonType}
              size={buttonSize}
              ghost={properties.ghost}
              danger={properties.danger}
              disabled={properties.disabled}
              icon={
                <Icon
                  blockId={`${blockId}_dropdown_icon`}
                  properties={{ name: 'chevron-down', title: '' }}
                />
              }
            />
          </Dropdown>
        </Space.Compact>
      );
    }

    // antd's Dropdown renders no element of its own, so the button is the block's outer element.
    return (
      <Dropdown {...dropdownProps}>
        <Button
          id={blockId}
          color={resolvedColor}
          variant={variant}
          type={buttonType}
          size={buttonSize}
          shape={properties.shape}
          ghost={properties.ghost}
          danger={properties.danger}
          disabled={properties.disabled}
          className={cn(classNames.element, classNames.button) || undefined}
          style={{ ...styles.element, ...styles.button }}
          icon={buttonIcon}
          iconPlacement={properties.iconPlacement}
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
