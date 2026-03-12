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
import { Menu } from 'antd';
import { type, get } from '@lowdefy/helpers';

import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';

const getDefaultMenu = (menus, menuId = 'default', links) => {
  if (type.isArray(links)) return links;
  if (!type.isArray(menus)) return [];
  const menu = menus.find((item) => item.menuId === menuId) ?? menus[0] ?? {};
  return menu.links ?? [];
};

const getTitle = ({ id, properties, pageId, url }) => properties?.title ?? pageId ?? url ?? id;

function buildMenuItems({
  links,
  events,
  components: { Icon, Link },
  classNames,
  isTopLevel = true,
}) {
  return (links ?? []).map((link, i) => {
    if (link.type === 'MenuDivider') {
      return {
        type: 'divider',
        key: link.id ?? i,
        dashed: link.properties?.dashed,
        style: link.style,
      };
    }

    if (link.type === 'MenuGroup') {
      const groupItem = {
        key: link.pageId ?? link.id,
        label: (
          <Link id={link.pageId ?? link.id ?? i} style={link.style} {...link}>
            {getTitle(link)}
          </Link>
        ),
        children: buildMenuItems({
          links: link.links,
          events,
          components: { Icon, Link },
          classNames,
          isTopLevel: false,
        }),
      };

      if (isTopLevel) {
        // Top-level MenuGroup → collapsible submenu (with icon)
        groupItem.icon = link.properties?.icon ? (
          <Icon blockId={`${link.id}_icon`} events={events} properties={link.properties.icon} />
        ) : undefined;
      } else {
        // Nested MenuGroup → non-collapsible group header
        groupItem.type = 'group';
      }

      return groupItem;
    }

    // MenuLink (default)
    return {
      key: link.pageId ?? link.id,
      danger: link.properties?.danger,
      className: classNames.item,
      icon: link.properties?.icon ? (
        <Icon blockId={`${link.id}_icon`} events={events} properties={link.properties.icon} />
      ) : undefined,
      label: (
        <Link
          id={link.pageId ?? link.id ?? i}
          style={link.style}
          url={link.url ?? link.properties?.url}
          newTab={link.newTab ?? link.properties?.newTab}
          {...link}
        >
          {getTitle(link)}
        </Link>
      ),
    };
  });
}

const MenuComp = ({
  blockId,
  classNames = {},
  components: { Icon, Link },
  events,
  menus,
  methods,
  pageId,
  properties,
  rename,
  styles = {},
}) => {
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

  const items = buildMenuItems({
    links: menu,
    events,
    components: { Icon, Link },
    classNames,
  });

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
            events={events}
            properties={properties.expandIcon}
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
          properties.collapsed !== true && [
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
};

export default withTheme('Menu', withBlockDefaults(MenuComp));
