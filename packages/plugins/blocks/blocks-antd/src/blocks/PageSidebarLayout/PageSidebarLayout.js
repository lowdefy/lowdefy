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

import React, { useState, useEffect } from 'react';
import { ConfigProvider } from 'antd';
import { get, mergeObjects, type } from '@lowdefy/helpers';
import { withBlockDefaults } from '@lowdefy/block-utils';

import Breadcrumb from '../Breadcrumb/Breadcrumb.js';
import Button from '../Button/Button.js';
import Content from '../Content/Content.js';
import Footer from '../Footer/Footer.js';
import Header from '../Header/Header.js';
import Layout from '../Layout/Layout.js';
import Menu from '../Menu/Menu.js';
import MobileMenu from '../MobileMenu/MobileMenu.js';
import Sider from '../Sider/Sider.js';
import { getDarkMode, renderHeaderActions, registerDarkModeMethod } from '../headerActions.js';

function getInitialSiderState({ properties }) {
  const storageKey = `lf-${properties.siderStorageKey ?? 'sider'}-open`;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    // localStorage unavailable (SSR, privacy mode)
  }
  return !properties.sider?.initialCollapsed;
}

function writeSiderState({ properties, open }) {
  const storageKey = `lf-${properties.siderStorageKey ?? 'sider'}-open`;
  try {
    localStorage.setItem(storageKey, String(open));
  } catch {
    // localStorage unavailable
  }
}

const PageSidebarLayout = ({
  basePath,
  blockId,
  classNames = {},
  components: { Icon, Link, ShortcutBadge },
  events,
  content,
  menus,
  methods,
  pageId,
  properties,
  styles = {},
}) => {
  const [openSiderState, setSiderOpen] = useState(() => getInitialSiderState({ properties }));
  useEffect(() => {
    registerDarkModeMethod(methods);
    methods.registerMethod('toggleSiderOpen', () => {
      const next = !openSiderState;
      methods._toggleSiderOpen({ open: next });
      setSiderOpen(next);
      writeSiderState({ properties, open: next });
    });
    methods.registerMethod('setSiderOpen', ({ open }) => {
      methods._toggleSiderOpen({ open });
      setSiderOpen(open);
      writeSiderState({ properties, open });
    });
  });
  const layout = (
    <Layout
      blockId={blockId}
      components={{ Icon, Link, ShortcutBadge }}
      events={events}
      properties={{ hasSider: true }}
      styles={{
        element: mergeObjects([{ minHeight: '100vh' }, styles.element]),
      }}
      content={{
        content: () => (
          <>
            <Sider
              blockId={`${blockId}_sider`}
              components={{ Icon, Link, ShortcutBadge }}
              events={events}
              methods={methods}
              properties={mergeObjects([
                properties.sider,
                {
                  initialCollapsed: !openSiderState,
                },
              ])}
              classNames={{
                element: `${classNames.sider ?? 'hidden lg:block'} hide-on-print`,
              }}
              styles={{
                element: mergeObjects([
                  { borderInlineEnd: '1px solid var(--ant-color-border)' },
                  styles.sider,
                ]),
              }}
              rename={{
                methods: {
                  toggleOpen: '_toggleSiderOpen',
                  setOpen: '_setSiderOpen',
                },
              }}
              content={{
                content: () => (
                  <div
                    style={{
                      display: 'flex',
                      height: '100%',
                      flexDirection: 'column',
                    }}
                  >
                    {!(get(properties, 'sider.hideToggleButton') ?? false) && (
                      <Button
                        blockId={`${blockId}_toggle_sider`}
                        components={{ Icon, Link, ShortcutBadge }}
                        classNames={{ element: classNames.toggleButton }}
                        events={events}
                        properties={{
                          hideTitle: true,
                          type: 'link',
                          block: true,
                          icon: {
                            name: openSiderState ? 'AiOutlineMenuFold' : 'AiOutlineMenuUnfold',
                          },
                          ...(properties.toggleSiderButton ?? {}),
                        }}
                        styles={{ element: styles.toggleButton }}
                        methods={methods}
                        onClick={() => methods.toggleSiderOpen()}
                        rename={{
                          events: {
                            onClick: 'onToggleSider',
                          },
                        }}
                      />
                    )}
                    <Menu
                      blockId={`${blockId}_menu`}
                      components={{ Icon, Link, ShortcutBadge }}
                      basePath={basePath}
                      classNames={{ element: classNames.menu ?? 'hidden lg:block' }}
                      events={events}
                      methods={methods}
                      menus={menus}
                      pageId={pageId}
                      properties={mergeObjects([
                        {
                          mode: 'inline',
                          collapsed: !openSiderState,
                        },
                        properties.menu,
                        properties.menuLg,
                      ])}
                      styles={{ element: styles.menu }}
                      rename={{
                        events: {
                          onClick: 'onMenuItemClick',
                          onSelect: 'onMenuItemSelect',
                          onToggleMenuGroup: 'onToggleMenuGroup',
                        },
                      }}
                    />
                    {openSiderState && content.siderOpen && (
                      <div style={{ flex: '0 0 auto' }}>{content.siderOpen()}</div>
                    )}
                    {!openSiderState && content.siderClosed && (
                      <div style={{ flex: '0 0 auto' }}>{content.siderClosed()}</div>
                    )}
                    <div style={{ flex: '1 0 auto' }} />
                    <div
                      style={{
                        position: 'sticky',
                        bottom: 0,
                        background: 'var(--ant-color-bg-container)',
                        padding: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      {renderHeaderActions({
                        blockId,
                        classNames: {
                          ...classNames,
                          headerActions:
                            classNames.headerActions ?? 'flex flex-col items-center gap-4 py-4',
                        },
                        styles,
                        properties,
                        methods,
                        events,
                        components: { Icon, Link, ShortcutBadge },
                        iconsColor: properties.iconsColor,
                      })}
                      <Link home={true}>
                        <img
                          src={
                            openSiderState
                              ? properties.logo?.src ??
                                `${basePath}/logo-${getDarkMode() ? 'dark' : 'light'}-theme.png`
                              : properties.logo?.srcMobile ??
                                properties.logo?.src ??
                                `${basePath}/logo-square-${
                                  getDarkMode() ? 'dark' : 'light'
                                }-theme.png`
                          }
                          alt={properties.logo?.alt ?? 'Lowdefy'}
                          className={classNames.logo}
                          style={mergeObjects([
                            { maxHeight: 32 },
                            properties.logo?.style,
                            styles.logo,
                          ])}
                        />
                      </Link>
                    </div>
                  </div>
                ),
              }}
            />
            <Layout
              blockId={`${blockId}_content_layout`}
              components={{ Icon, Link, ShortcutBadge }}
              events={events}
              content={{
                content: () => (
                  <>
                    <div
                      className={`${classNames.mobileHeader ?? 'block lg:hidden'} hide-on-print`}
                    >
                      <Header
                        blockId={`${blockId}_mobile_header`}
                        components={{ Icon, Link, ShortcutBadge }}
                        events={events}
                        properties={{}}
                        styles={{
                          element: mergeObjects([
                            {
                              alignItems: 'center',
                            },
                            styles.mobileHeader,
                          ]),
                        }}
                        content={{
                          content: () => (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                              }}
                            >
                              <Link home={true}>
                                <img
                                  src={
                                    properties.logo?.srcMobile ??
                                    properties.logo?.src ??
                                    `${basePath}/logo-square-${
                                      getDarkMode() ? 'dark' : 'light'
                                    }-theme.png`
                                  }
                                  alt={properties.logo?.alt ?? 'Lowdefy'}
                                  className={classNames.logo}
                                  style={mergeObjects([
                                    { width: 32, marginRight: 12 },
                                    properties.logo?.style,
                                    styles.logo,
                                  ])}
                                />
                              </Link>
                              <div style={{ flex: '1 0 auto' }}>
                                {content.mobileExtra && content.mobileExtra()}
                              </div>
                              {renderHeaderActions({
                                blockId,
                                classNames,
                                styles,
                                properties,
                                methods,
                                events,
                                components: { Icon, Link, ShortcutBadge },
                                iconsColor: properties.iconsColor,
                              })}
                              <MobileMenu
                                classNames={{
                                  element: classNames.mobileMenu ?? 'flex lg:hidden shrink pl-4',
                                }}
                                styles={{ element: styles.mobileMenu }}
                                blockId={`${blockId}_mobile_menu`}
                                components={{ Icon, Link, ShortcutBadge }}
                                basePath={basePath}
                                events={events}
                                methods={methods}
                                menus={menus}
                                pageId={pageId}
                                properties={mergeObjects([
                                  {
                                    mode: 'inline',
                                    logo: properties.logo,
                                    drawer: { width: '100%', placement: 'right' },
                                  },
                                  properties.menu,
                                  properties.menuMd,
                                ])}
                                content={{
                                  drawerContent: content.mobileDrawerContent,
                                  drawerFooter: content.mobileDrawerFooter,
                                }}
                                rename={{
                                  methods: {
                                    toggleOpen: 'toggleMobileMenuOpen',
                                    setOpen: 'setMobileMenuOpen',
                                  },
                                  events: {
                                    onClose: 'onMobileMenuClose',
                                    onOpen: 'onMobileMenuOpen',
                                  },
                                }}
                              />
                            </div>
                          ),
                        }}
                      />
                    </div>
                    {content.header && (
                      <Header
                        blockId={`${blockId}_header`}
                        components={{ Icon, Link, ShortcutBadge }}
                        classNames={{
                          element: `${classNames.header ?? ''} hide-on-print`,
                        }}
                        events={events}
                        properties={properties.header ?? {}}
                        styles={{
                          element: mergeObjects([
                            {
                              display: 'flex',
                              alignItems: 'center',
                            },
                            styles.header,
                          ]),
                        }}
                        content={{
                          content: () => (
                            <div
                              style={mergeObjects([
                                {
                                  display: 'flex',
                                  flex: '1 0 auto',
                                  alignItems: 'center',
                                },
                                properties.header?.contentStyle,
                              ])}
                            >
                              {content.header()}
                            </div>
                          ),
                        }}
                      />
                    )}
                    <Content
                      blockId={`${blockId}_content`}
                      components={{ Icon, Link, ShortcutBadge }}
                      classNames={{ element: classNames.content }}
                      events={events}
                      properties={properties.content ?? {}}
                      styles={{
                        element: mergeObjects([
                          {
                            padding: '0 40px 40px 40px',
                            minWidth: 0,
                          },
                          styles.content,
                        ]),
                      }}
                      content={{
                        content: () => (
                          <>
                            {!type.isNone(properties.breadcrumb) ? (
                              <Breadcrumb
                                blockId={`${blockId}_breadcrumb`}
                                basePath={basePath}
                                components={{ Icon, Link, ShortcutBadge }}
                                classNames={{ element: classNames.breadcrumb }}
                                events={events}
                                methods={methods}
                                properties={properties.breadcrumb}
                                styles={{
                                  element: mergeObjects([{ margin: '16px 0' }, styles.breadcrumb]),
                                }}
                                rename={{
                                  events: {
                                    onClick: 'onBreadcrumbClick',
                                  },
                                }}
                              />
                            ) : (
                              <div className="py-1.5 sm:py-1.5 md:py-2.5 lg:py-5" />
                            )}
                            {content.content && content.content()}
                          </>
                        ),
                      }}
                    />
                    {content.footer && (
                      <Footer
                        blockId={`${blockId}_footer`}
                        components={{ Icon, Link, ShortcutBadge }}
                        classNames={{ element: classNames.footer }}
                        events={events}
                        properties={properties.footer}
                        styles={{
                          element: mergeObjects([properties.footer?.style, styles.footer]),
                        }}
                        content={{
                          content: () => content.footer(),
                        }}
                      />
                    )}
                  </>
                ),
              }}
            />
          </>
        ),
      }}
    />
  );
  return layout;
};

function PageSidebarLayoutWithTheme(props) {
  const { theme, ...restProperties } = props.properties;
  if (!type.isObject(theme)) {
    return <PageSidebarLayout {...props} />;
  }
  return (
    <ConfigProvider theme={{ token: theme }}>
      <PageSidebarLayout {...props} properties={restProperties} />
    </ConfigProvider>
  );
}

export default withBlockDefaults(PageSidebarLayoutWithTheme);
