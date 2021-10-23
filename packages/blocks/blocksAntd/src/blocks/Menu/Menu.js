/*
  Copyright 2020-2021 Lowdefy, Inc

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
import color from '@lowdefy/color';
import { blockDefaultProps } from '@lowdefy/block-tools';
import { type, get } from '@lowdefy/helpers';
import { Link } from 'react-router-dom';
import { Menu } from 'antd';
import Icon from '../Icon/Icon';

const getDefaultMenu = (menus, menuId = 'default', links) => {
  if (type.isArray(links)) return links;
  if (!type.isArray(menus)) return [];
  const menu = menus.find((item) => item.menuId === menuId) || menus[0] || {};
  return menu.links || [];
};

const getTitle = (id, properties, defaultTitle) =>
  (properties && properties.title) || defaultTitle || id;

const MenuTitle = ({ id, basePath, makeCssClass, pageId, properties, url, linkStyle }) =>
  type.isString(pageId) ? (
    <Link to={`${basePath}/${pageId}`} className={makeCssClass([linkStyle])}>
      {getTitle(id, properties, pageId)}
    </Link>
  ) : type.isString(url) ? (
    <a href={url} className={makeCssClass([linkStyle])}>
      {getTitle(id, properties, url)}
    </a>
  ) : (
    <span className={makeCssClass([linkStyle])}>{getTitle(id, properties)}</span>
  );

const getNestedColors = (menuColor, background) => {
  const fontColor = color(menuColor, 6);
  const bgColor = color(menuColor, 3);
  return {
    backgroundColor: background && `${bgColor} !important`,
    color: `${fontColor} !important`,
    '& > *': {
      color: `${fontColor} !important`,
    },
    '& > * > *': {
      color: `${fontColor} !important`,
    },
    borderColor: `${fontColor} !important`,
    '&:after': {
      borderColor: `${fontColor} !important`,
    },
  };
};

const MenuComp = ({ basePath, blockId, events, methods, menus, pageId, properties, rename }) => {
  const styles = {
    lineHeight: '64px',
    display: properties.mode === 'horizontal' && 'inline-block',
  };
  const exProps = {};
  if (properties.mode === 'inline') {
    exProps.collapsed = properties.collapsed;
    exProps.inlineIndent = properties.inlineIndent;
  }
  const menu = getDefaultMenu(menus, properties.menuId, properties.links);
  const theme = properties.theme || 'dark';
  const nestedColors = getNestedColors(properties.selectedColor);
  const nestedColorsBg = getNestedColors(properties.selectedColor, true);
  const bgColorDarker = {
    backgroundColor:
      properties.backgroundColor && `${color(properties.backgroundColor, 7)} !important`,
  };
  const bgColor = {
    backgroundColor: properties.backgroundColor && `${properties.backgroundColor} !important`,
  };
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
      className={methods.makeCssClass([
        styles,
        properties.backgroundColor && bgColor,
        properties.selectedColor &&
          theme === 'dark' && {
            '& > li.ant-menu-item-selected': nestedColorsBg,
            '& > li.ant-menu-submenu > ul > li.ant-menu-item-selected': nestedColorsBg,
            '& > li.ant-menu-submenu > ul > li.ant-menu-item-group > ul > li.ant-menu-item-selected':
              nestedColorsBg,
          },
        properties.selectedColor &&
          theme === 'light' && {
            '& > li.ant-menu-item-selected': nestedColorsBg,
            '& > li.ant-menu-submenu-selected': nestedColors,
            '& > li.ant-menu-item:hover': nestedColors,
            '& > li.ant-menu-submenu:hover': nestedColors,
            '& > li.ant-menu-submenu > ul > li.ant-menu-item:hover': nestedColors,
            '& > li.ant-menu-submenu > ul > li.ant-menu-item-selected': nestedColorsBg,
            '& > li.ant-menu-submenu > ul > li.ant-menu-item-group > ul > li.ant-menu-item-selected':
              nestedColorsBg,
          },
        properties.style,
      ])}
      defaultOpenKeys={
        properties.defaultOpenKeys ||
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
                  .some((link) => (properties.selectedKeys || [pageId]).indexOf(link) !== -1)
              ) || {}
            ).id,
          ]) ||
        []
      }
      selectedKeys={properties.selectedKeys || [pageId]}
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
                key={link.id || i}
                className={methods.makeCssClass([link.style])}
                dashed={link.properties && link.properties.dashed}
              />
            );
          case 'MenuGroup':
            return (
              <Menu.SubMenu
                className={methods.makeCssClass([
                  {
                    '& > ul': bgColorDarker,
                  },
                ])}
                popupClassName={methods.makeCssClass([
                  properties.backgroundColor && {
                    '& > ul': bgColorDarker,
                  },
                  properties.selectedColor &&
                    theme === 'dark' && {
                      '& > ul > li.ant-menu-item-selected': nestedColorsBg,
                      '& > ul > li.ant-menu-item-group > ul > li.ant-menu-item-selected':
                        nestedColorsBg,
                    },
                  properties.selectedColor &&
                    theme === 'light' && {
                      '& > ul > li.ant-menu-item-selected': nestedColorsBg,
                      '& > ul > li.ant-menu-item:hover': nestedColors,
                      '& > ul > li.ant-menu-item-group > ul > li.ant-menu-item-selected':
                        nestedColorsBg,
                    },
                ])}
                key={link.pageId || link.id}
                title={
                  <MenuTitle
                    basePath={basePath}
                    linkStyle={methods.makeCssClass(link.style, { styleObjectOnly: true })}
                    id={link.id}
                    makeCssClass={methods.makeCssClass}
                    properties={link.properties}
                  />
                }
                icon={
                  link.properties &&
                  link.properties.icon && (
                    <Icon
                      blockId={`${link.id}_icon`}
                      events={events}
                      properties={link.properties.icon}
                    />
                  )
                }
              >
                {get(link, 'links', { default: [] }).map((subLink) => {
                  switch (subLink.type) {
                    case 'MenuDivider':
                      return (
                        <Menu.Divider
                          key={subLink.id || i}
                          className={methods.makeCssClass([subLink.style])}
                          dashed={subLink.properties && subLink.properties.dashed}
                        />
                      );
                    case 'MenuGroup':
                      return (
                        <Menu.ItemGroup
                          key={subLink.pageId || subLink.id}
                          title={
                            <MenuTitle
                              basePath={basePath}
                              linkStyle={methods.makeCssClass(subLink.style, {
                                styleObjectOnly: true,
                              })}
                              id={subLink.id}
                              makeCssClass={methods.makeCssClass}
                              properties={subLink.properties}
                            />
                          }
                        >
                          {subLink.links.map((subLinkGroup) => {
                            if (subLinkGroup.type === 'MenuDivider') {
                              return (
                                <Menu.Divider
                                  key={subLink.id || i}
                                  className={methods.makeCssClass([subLink.style])}
                                  dashed={subLink.properties && subLink.properties.dashed}
                                />
                              );
                            }
                            return (
                              <Menu.Item
                                key={subLinkGroup.pageId || subLinkGroup.id}
                                danger={get(subLinkGroup, 'properties.danger')}
                                icon={
                                  subLinkGroup.properties &&
                                  subLinkGroup.properties.icon && (
                                    <Icon
                                      blockId={`${subLinkGroup.id}_icon`}
                                      events={events}
                                      properties={subLinkGroup.properties.icon}
                                    />
                                  )
                                }
                              >
                                <MenuTitle
                                  basePath={basePath}
                                  linkStyle={methods.makeCssClass(subLinkGroup.style, {
                                    styleObjectOnly: true,
                                  })}
                                  id={subLinkGroup.id}
                                  makeCssClass={methods.makeCssClass}
                                  pageId={subLinkGroup.pageId}
                                  properties={subLinkGroup.properties}
                                  url={subLinkGroup.url}
                                />
                              </Menu.Item>
                            );
                          })}
                        </Menu.ItemGroup>
                      );
                    case 'MenuLink':
                    default:
                      return (
                        <Menu.Item
                          key={subLink.pageId || subLink.id}
                          danger={get(subLink, 'properties.danger')}
                          icon={
                            subLink.properties &&
                            subLink.properties.icon && (
                              <Icon
                                blockId={`${subLink.id}_icon`}
                                events={events}
                                properties={subLink.properties.icon}
                              />
                            )
                          }
                        >
                          <MenuTitle
                            basePath={basePath}
                            linkStyle={methods.makeCssClass(subLink.style, {
                              styleObjectOnly: true,
                            })}
                            id={subLink.id}
                            makeCssClass={methods.makeCssClass}
                            pageId={subLink.pageId}
                            properties={subLink.properties}
                            url={subLink.url}
                          />
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
                key={link.pageId || link.id}
                danger={get(link, 'properties.danger')}
                icon={
                  link.properties &&
                  link.properties.icon && (
                    <Icon
                      blockId={`${link.id}_icon`}
                      events={events}
                      properties={link.properties.icon}
                    />
                  )
                }
              >
                <MenuTitle
                  basePath={basePath}
                  linkStyle={methods.makeCssClass(link.style, { styleObjectOnly: true })}
                  id={link.id}
                  makeCssClass={methods.makeCssClass}
                  pageId={link.pageId}
                  properties={link.properties}
                  url={link.url}
                />
              </Menu.Item>
            );
        }
      })}
    </Menu>
  );
};

MenuComp.defaultProps = blockDefaultProps;

export default MenuComp;
