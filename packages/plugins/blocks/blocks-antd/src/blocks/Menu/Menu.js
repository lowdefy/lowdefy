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

import React, { useCallback, useContext } from 'react';
import { Layout, Menu } from 'antd';
import { type, get } from '@lowdefy/helpers';

const SiderContext = Layout._InternalSiderContext;

import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';
import useItemShortcuts from '../useItemShortcuts.js';
import { buildMenuItems } from '../buildMenuItems.js';

const getDefaultMenu = (menus, menuId = 'default', links) => {
  if (type.isArray(links)) return links;
  if (!type.isArray(menus)) return [];
  const menu = menus.find((item) => item.menuId === menuId) ?? menus[0] ?? {};
  return menu.links ?? [];
};

function collectLinkShortcuts(links) {
  const result = [];
  (links ?? []).forEach((link) => {
    if (link.type === 'MenuLink' || !link.type) {
      if (link.properties?.shortcut) {
        result.push({ key: link.pageId ?? link.id, shortcut: link.properties.shortcut });
      }
    }
    if (link.links) {
      result.push(...collectLinkShortcuts(link.links));
    }
  });
  return result;
}

function makeWrapGroupLabel(Link) {
  return function wrapGroupLabel({ link, labelText, classNames: labelClass, styles: labelStyle }) {
    const { class: _omitClass, style: _omitStyle, ...linkRest } = link;
    return (
      <Link
        {...linkRest}
        id={link.pageId ?? link.id}
        className={labelClass || undefined}
        style={labelStyle}
      >
        {labelText}
      </Link>
    );
  };
}

function MenuComp({
  blockId,
  classNames = {},
  components: { Icon, Link, ShortcutBadge },
  events,
  menus,
  methods,
  pageId,
  properties,
  rename,
  styles = {},
}) {
  const horizontalStyles = {
    lineHeight: '64px',
    width: '100%',
    display: properties.mode === 'horizontal' ? 'inline-block' : undefined,
  };
  const exProps = {};
  if (properties.mode === 'inline') {
    exProps.collapsed = properties.collapsed;
    exProps.inlineIndent = properties.inlineIndent;
  }
  const menu = getDefaultMenu(menus, properties.menuId, properties.links);
  const theme = properties.theme;
  const { siderCollapsed } = useContext(SiderContext) ?? {};
  const isCollapsed = properties.collapsed === true || siderCollapsed === true;

  // Back-compat: the prior cssKey for the menu item icon was `icon`; the shared helper
  // standardises on `itemIcon`. Map either through so existing YAML keeps working.
  const itemsClassNames = { ...classNames, itemIcon: classNames.itemIcon ?? classNames.icon };
  const itemsStyles = { ...styles, itemIcon: styles.itemIcon ?? styles.icon };
  const items = buildMenuItems({
    links: menu,
    events,
    components: { Icon, Link, ShortcutBadge },
    classNames: itemsClassNames,
    styles: itemsStyles,
    wrapGroupLabel: makeWrapGroupLabel(Link),
    nestedGroupAsGroup: true,
    getKey: (link) => link.pageId ?? link.id,
  });

  const shortcutItems = collectLinkShortcuts(menu);
  const onShortcutMatch = useCallback(
    (key) => {
      methods.triggerEvent({
        name: get(rename, 'events.onSelect', { default: 'onSelect' }),
        event: { key },
      });
    },
    [methods, rename]
  );
  useItemShortcuts({ items: shortcutItems, onMatch: onShortcutMatch });

  return (
    <Menu
      id={blockId}
      className={classNames.element}
      style={{ ...horizontalStyles, ...styles.element }}
      items={items}
      expandIcon={
        properties.expandIcon && (
          <Icon
            blockId={`${blockId}_expandIcon`}
            classNames={{ element: classNames.expandIcon }}
            events={events}
            properties={properties.expandIcon}
            styles={{ element: styles.expandIcon }}
          />
        )
      }
      forceSubMenuRender={properties.forceSubMenuRender}
      mode={properties.mode}
      selectable={true}
      theme={theme}
      defaultOpenKeys={
        properties.defaultOpenKeys ??
        (properties.mode === 'inline' &&
          !isCollapsed && [
            (
              menu.find((link) =>
                (link.links || [])
                  .map((subLink) =>
                    subLink.links
                      ? subLink.links.map((subSubLink) => subSubLink.pageId)
                      : [subLink.pageId]
                  )
                  .flat()
                  .some((link) => (properties.selectedKeys ?? [pageId]).indexOf(link) !== -1)
              ) ?? {}
            ).id,
          ]) ??
        []
      }
      selectedKeys={properties.selectedKeys ?? [pageId]}
      subMenuCloseDelay={properties.subMenuCloseDelay}
      subMenuOpenDelay={properties.subMenuOpenDelay}
      onSelect={(item) =>
        methods.triggerEvent({
          name: get(rename, 'events.onSelect', { default: 'onSelect' }),
          event: { key: item.key },
        })
      }
      onClick={(item) =>
        methods.triggerEvent({
          name: get(rename, 'events.onClick', { default: 'onClick' }),
          event: { key: item.key },
        })
      }
      onOpenChange={(openKeys) =>
        methods.triggerEvent({
          name: get(rename, 'events.onToggleMenuGroup', { default: 'onToggleMenuGroup' }),
          event: { openKeys },
        })
      }
      {...exProps}
    />
  );
}

export default withTheme('Menu', withBlockDefaults(MenuComp));
