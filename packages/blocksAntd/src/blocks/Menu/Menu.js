/*
  Copyright 2020 Lowdefy, Inc

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

const getDefaultMenu = (menus, menuId, links) => {
  if (type.isArray(links)) return links || [];
  if (menuId) {
    return (menus.find((item) => item.menuId === menuId) || {}).links || [];
  }
  return (
    (menus.find((item) => item.menuId === 'default') || {}).links || (menus[0] || {}).links || []
  );
};

const getTitle = (id, properties, defaultTitle) =>
  (properties && properties.title) || defaultTitle || id;

const MenuTitle = ({ id, methods, menuId, pageId, properties, url, linkStyle }) =>
  type.isString(pageId) ? (
    <Link to={`/${pageId}`} className={methods.makeCssClass([linkStyle])}>
      {getTitle(id, properties, pageId)}
    </Link>
  ) : type.isString(url) ? (
    <a href={url} className={methods.makeCssClass([linkStyle])}>
      {getTitle(id, properties, url)}
    </a>
  ) : (
    <span className={methods.makeCssClass([linkStyle])}>{getTitle(id, properties, menuId)}</span>
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

const MenuComp = ({ blockId, methods, menus, pageId, properties }) => {
  const styles = {
    lineHeight: '64px',
    display: properties.mode === 'horizontal' && 'inline-block',
  };
  const exProps = {};
  if (properties.mode === 'inline') {
    exProps.inlineCollapsed = properties.inlineCollapsed;
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
      mode={properties.mode}
      className={methods.makeCssClass([
        styles,
        properties.backgroundColor && bgColor,
        properties.selectedColor &&
          theme === 'dark' && {
            '& > li.ant-menu-item-selected': nestedColorsBg,
            '& > li.ant-menu-submenu > ul > li.ant-menu-item-selected': nestedColorsBg,
          },
        properties.selectedColor &&
          theme === 'light' && {
            '& > li.ant-menu-item-selected': nestedColorsBg,
            '& > li.ant-menu-submenu-selected': nestedColors,
            '& > li.ant-menu-item:hover': nestedColors,
            '& > li.ant-menu-submenu:hover': nestedColors,
            '& > li.ant-menu-submenu > ul > li.ant-menu-item:hover': nestedColors,
            '& > li.ant-menu-submenu > ul > li.ant-menu-item-selected': nestedColorsBg,
          },
        properties.style,
      ])}
      theme={theme}
      selectedKeys={properties.selectedKeys || [pageId]}
      subMenuCloseDelay={properties.subMenuCloseDelay}
      subMenuOpenDelay={properties.subMenuOpenDelay}
      onSelect={(item, key) => methods.callAction({ action: 'onSelect', args: { item, key } })}
      onClick={(item, key) => methods.callAction({ action: 'onClick', args: { item, key } })}
      onOpenChange={(openKeys) =>
        methods.callAction({ action: 'onOpenChange', args: { openKeys } })
      }
      {...exProps}
    >
      {menu.map((link) => {
        switch (link.type) {
          case 'MenuGroup':
            return (
              <Menu.SubMenu
                className={methods.makeCssClass([
                  {
                    '& > ul.ant-menu-sub': bgColorDarker,
                  },
                ])}
                popupClassName={methods.makeCssClass([
                  properties.backgroundColor && {
                    '& > ul.ant-menu-sub': bgColorDarker,
                  },
                  properties.selectedColor &&
                    theme === 'dark' && {
                      '& > ul.ant-menu-sub > li.ant-menu-item-selected': nestedColorsBg,
                    },
                  properties.selectedColor &&
                    theme === 'light' && {
                      '& > ul.ant-menu-sub > li.ant-menu-item-selected': nestedColorsBg,
                      '& > ul.ant-menu-sub > li.ant-menu-item:hover': nestedColors,
                    },
                ])}
                key={link.id}
                title={
                  <MenuTitle
                    linkStyle={link.style}
                    id={link.id}
                    methods={methods}
                    menuId={link.menuId}
                    pageId={link.pageId}
                    properties={link.properties}
                    url={link.url}
                  />
                }
                icon={
                  link.properties &&
                  link.properties.icon && (
                    <Icon
                      blockId={`${link.id}_icon`}
                      methods={methods}
                      properties={link.properties.icon}
                    />
                  )
                }
              >
                {get(link, 'links', { default: [] }).map((subLink) => {
                  switch (subLink.type) {
                    case 'MenuGroup':
                      return (
                        <Menu.ItemGroup
                          key={subLink.id}
                          title={
                            <MenuTitle
                              linkStyle={subLink.style}
                              id={subLink.id}
                              methods={methods}
                              menuId={subLink.menuId}
                              properties={subLink.properties}
                              url={subLink.url}
                              pageId={subLink.pageId}
                            />
                          }
                        >
                          {subLink.links.map((subLinkGroup) => (
                            <Menu.Item
                              key={subLinkGroup.id}
                              danger={get(subLinkGroup, 'properties.danger')}
                              icon={
                                subLinkGroup.properties &&
                                subLinkGroup.properties.icon && (
                                  <Icon
                                    blockId={`${subLinkGroup.id}_icon`}
                                    methods={methods}
                                    properties={subLinkGroup.properties.icon}
                                  />
                                )
                              }
                            >
                              <MenuTitle
                                linkStyle={subLinkGroup.style}
                                id={subLinkGroup.id}
                                methods={methods}
                                menuId={subLinkGroup.menuId}
                                pageId={subLinkGroup.pageId}
                                properties={subLinkGroup.properties}
                                url={subLinkGroup.url}
                              />
                            </Menu.Item>
                          ))}
                        </Menu.ItemGroup>
                      );
                    case 'MenuLink':
                    default:
                      return (
                        <Menu.Item
                          key={subLink.id}
                          danger={get(subLink, 'properties.danger')}
                          icon={
                            subLink.properties &&
                            subLink.properties.icon && (
                              <Icon
                                blockId={`${subLink.id}_icon`}
                                methods={methods}
                                properties={subLink.properties.icon}
                              />
                            )
                          }
                        >
                          <MenuTitle
                            linkStyle={subLink.style}
                            id={subLink.id}
                            methods={methods}
                            menuId={subLink.menuId}
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
                key={link.id}
                danger={get(link, 'properties.danger')}
                icon={
                  link.properties &&
                  link.properties.icon && (
                    <Icon
                      blockId={`${link.id}_icon`}
                      methods={methods}
                      properties={link.properties.icon}
                    />
                  )
                }
              >
                <MenuTitle
                  linkStyle={link.style}
                  id={link.id}
                  methods={methods}
                  menuId={link.menuId}
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
