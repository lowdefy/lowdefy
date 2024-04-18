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
import { blockDefaultProps } from '@lowdefy/block-utils';
import { Menu } from 'antd';
import { type, get } from '@lowdefy/helpers';

const getDefaultMenu = (menus, menuId = 'default', links) => {
  if (type.isArray(links)) return links;
  if (!type.isArray(menus)) return [];
  const menu = menus.find((item) => item.menuId === menuId) ?? menus[0] ?? {};
  return menu.links ?? [];
};

const getTitle = ({ id, properties, pageId, url }) => properties?.title ?? pageId ?? url ?? id;

const MenuComp = ({
  blockId,
  components: { Icon, Link },
  events,
  menus,
  methods,
  pageId,
  properties,
  rename,
}) => {
  const styles = {
    lineHeight: '64px',
    width: '100%',
    display: properties.mode === 'horizontal' && 'inline-block',
  };
  const exProps = {};
  if (properties.mode === 'inline') {
    exProps.collapsed = properties.collapsed;
    exProps.inlineIndent = properties.inlineIndent;
  }
  const menu = getDefaultMenu(menus, properties.menuId, properties.links);
  const theme = properties.theme ?? 'dark';
  return (
    <Menu
      id={blockId}
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
      className={methods.makeCssClass([styles, properties.style])}
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
    >
      {menu.map((link, i) => {
        switch (link.type) {
          case 'MenuDivider':
            return (
              <Menu.Divider
                key={link.id}
                className={methods.makeCssClass([link.style])}
                dashed={link.properties?.dashed}
              />
            );
          case 'MenuGroup':
            return (
              <Menu.SubMenu
                key={link.pageId ?? link.id}
                title={
                  <Link
                    id={link.pageId ?? link.id ?? i}
                    className={methods.makeCssClass(link.style, true)}
                    {...link}
                  >
                    {getTitle(link)}
                  </Link>
                }
                icon={
                  link.properties?.icon && (
                    <Icon
                      blockId={`${link.id}_icon`}
                      events={events}
                      properties={link.properties.icon}
                    />
                  )
                }
              >
                {get(link, 'links', { default: [] }).map((subLink, j) => {
                  switch (subLink.type) {
                    case 'MenuDivider':
                      return (
                        <Menu.Divider
                          key={subLink.id ?? j}
                          className={methods.makeCssClass([subLink.style])}
                          dashed={subLink.properties?.dashed}
                        />
                      );
                    case 'MenuGroup':
                      return (
                        <Menu.ItemGroup
                          key={subLink.pageId ?? subLink.id}
                          title={
                            <Link
                              id={subLink.pageId ?? subLink.id ?? j}
                              className={methods.makeCssClass(subLink.style, true)}
                              {...subLink}
                            >
                              {getTitle(subLink)}
                            </Link>
                          }
                        >
                          {subLink.links.map((subLinkGroup, k) => {
                            if (subLinkGroup.type === 'MenuDivider') {
                              return (
                                <Menu.Divider
                                  key={`${subLink.id}_${k}`}
                                  className={methods.makeCssClass([subLink.style])}
                                  dashed={subLink.properties?.dashed}
                                />
                              );
                            }
                            return (
                              <Menu.Item
                                key={subLinkGroup.pageId ?? subLinkGroup.id}
                                danger={get(subLinkGroup, 'properties.danger')}
                                icon={
                                  subLinkGroup.properties?.icon && (
                                    <Icon
                                      blockId={`${subLinkGroup.id}_icon`}
                                      events={events}
                                      properties={subLinkGroup.properties.icon}
                                    />
                                  )
                                }
                              >
                                <Link
                                  id={subLinkGroup.pageId ?? subLinkGroup.id ?? k}
                                  className={methods.makeCssClass(subLinkGroup.style, true)}
                                  {...subLinkGroup}
                                >
                                  {getTitle(subLinkGroup)}
                                </Link>
                              </Menu.Item>
                            );
                          })}
                        </Menu.ItemGroup>
                      );
                    case 'MenuLink':
                    default:
                      return (
                        <Menu.Item
                          key={subLink.pageId ?? subLink.id}
                          danger={get(subLink, 'properties.danger')}
                          icon={
                            subLink.properties?.icon && (
                              <Icon
                                blockId={`${subLink.id}_icon`}
                                events={events}
                                properties={subLink.properties.icon}
                              />
                            )
                          }
                        >
                          <Link
                            id={subLink.pageId ?? subLink.id ?? j}
                            className={methods.makeCssClass(subLink.style, true)}
                            {...subLink}
                          >
                            {getTitle(subLink)}
                          </Link>
                        </Menu.Item>
                      );
                  }
                })}
              </Menu.SubMenu>
            );
          case 'MenuLink':
          default:
            return (
              <Menu.Item
                key={link.pageId ?? link.id}
                danger={get(link, 'properties.danger')}
                icon={
                  link.properties?.icon && (
                    <Icon
                      blockId={`${link.id}_icon`}
                      events={events}
                      properties={link.properties.icon}
                    />
                  )
                }
              >
                <Link
                  id={link.pageId ?? link.id ?? i}
                  className={methods.makeCssClass(link.style, true)}
                  {...link}
                >
                  {getTitle(link)}
                </Link>
              </Menu.Item>
            );
        }
      })}
    </Menu>
  );
};

MenuComp.defaultProps = blockDefaultProps;
MenuComp.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/Menu/style.less'],
};

export default MenuComp;
