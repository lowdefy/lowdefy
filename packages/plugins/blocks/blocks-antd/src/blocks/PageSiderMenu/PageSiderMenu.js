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

import React, { useState, useEffect } from 'react';
import { get, mergeObjects, type } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-utils';

import Affix from '../Affix/Affix.js';
import Breadcrumb from '../Breadcrumb/Breadcrumb.js';
import Button from '../Button/Button.js';
import Content from '../Content/Content.js';
import Footer from '../Footer/Footer.js';
import Header from '../Header/Header.js';
import Layout from '../Layout/Layout.js';
import Menu from '../Menu/Menu.js';
import MobileMenu from '../MobileMenu/MobileMenu.js';
import Sider from '../Sider/Sider.js';

const PageSiderMenu = ({
  basePath,
  blockId,
  components: { Icon, Link },
  events,
  content,
  menus,
  methods,
  pageId,
  properties,
}) => {
  const [openSiderState, setSiderOpen] = useState(!properties.sider?.initialCollapsed);
  useEffect(() => {
    methods.registerMethod('toggleSiderOpen', () => {
      methods._toggleSiderOpen({ open: !openSiderState });
      setSiderOpen(!openSiderState);
    });
    methods.registerMethod('setSiderOpen', ({ open }) => {
      methods._toggleSiderOpen({ open });
      setSiderOpen(open);
    });
  });
  const styles = {
    layout: { minHeight: '100vh' },
    header: {
      display: 'flex',
      alignItems: 'center',
      padding: '0 46px',
      xs: { padding: '0 10px' },
      sm: { padding: '0 15px' },
      md: { padding: '0 30px' },
      lg: { padding: '0 46px' },
      flexDirection: 'row-reverse',
    },
    headerContent: {
      alignItems: 'center',
      flex: '1 1 auto',
      display: 'flex',
      justifyContent: 'flex-end',
    },
    logo: {
      margin: '0 30px 0 0',
      flex: '0 1 auto',
      width: 130,
      xs: { margin: '0 5px', width: 40 },
      sm: { margin: '0 10px', width: 130 },
      md: { margin: '0 15px' },
    },
    desktop: {
      display: 'none',
      lg: { display: 'block' },
    },
    mobile: {
      display: 'block',
      lg: { display: 'none' },
    },
    mdMenu: {
      paddingLeft: '1rem',
    },
    body: {
      padding: '0 40px 40px 40px',
      xs: { padding: '0 5px 5px 5px' },
      sm: { padding: '0 10px 10px 10px' },
      md: { padding: '0 20px 20px 20px' },
      lg: { padding: '0 40px 40px 40px' },
    },
    sider: {
      display: 'flex',
      height: '100%',
      flexDirection: 'column',
    },
    content: {},
    breadcrumb: {
      margin: '16px 0',
    },
    noBreadcrumb: {
      padding: '20px 0',
      xs: { padding: '5px 0' },
      sm: { padding: '5px 0' },
      md: { padding: '10px 0' },
    },
  };
  return (
    <Layout
      blockId={blockId}
      components={{ Icon, Link }}
      events={events}
      properties={{ style: mergeObjects([styles.layout, properties.style]) }}
      content={{
        // TODO: use next/image
        content: () => (
          <>
            <Header
              blockId={`${blockId}_header`}
              components={{ Icon, Link }}
              events={events}
              properties={mergeObjects([{ style: styles.header }, properties.header])}
              content={{
                content: () => (
                  <>
                    <div className={methods.makeCssClass(styles.headerContent)}>
                      {content.header &&
                        content.header(
                          mergeObjects([{ width: 'auto' }, properties.header?.contentStyle])
                        )}
                      <div className={methods.makeCssClass([styles.mobile, styles.mdMenu])}>
                        <MobileMenu
                          blockId={`${blockId}_mobile_menu`}
                          components={{ Icon, Link }}
                          basePath={basePath}
                          events={events}
                          methods={methods}
                          menus={menus}
                          pageId={pageId}
                          properties={mergeObjects([
                            {
                              mode: 'inline',
                              theme: get(properties, 'sider.theme') ?? 'light',
                            },
                            properties.menu,
                            properties.menuMd,
                          ])}
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
                    </div>
                    <Link home={true}>
                      <picture>
                        <source
                          media={`(min-width:${properties.logo?.breakpoint ?? 577}px)`}
                          srcSet={
                            properties.logo?.src ??
                            `${basePath}/logo-${properties.header?.theme ?? 'dark'}-theme.png`
                          }
                        />
                        <img
                          src={
                            properties.logo?.srcMobile ??
                            properties.logo?.src ??
                            `${basePath}/logo-square-${
                              properties.header?.theme ?? 'dark'
                            }-theme.png`
                          }
                          alt={properties.logo?.alt ?? 'Lowdefy'}
                          className={methods.makeCssClass([styles.logo, properties.logo?.style])}
                        />
                      </picture>
                    </Link>
                  </>
                ),
              }}
            />
            <Layout
              blockId={`${blockId}_layout`}
              components={{ Icon, Link }}
              events={events}
              properties={properties.layout}
              content={{
                content: () => (
                  <>
                    <Sider
                      blockId={`${blockId}_sider`}
                      components={{ Icon, Link }}
                      events={events}
                      methods={methods}
                      properties={mergeObjects([
                        {
                          theme: get(properties, 'sider.theme') ?? 'light',
                          style: styles.desktop,
                        },
                        properties.sider,
                      ])}
                      rename={{
                        methods: {
                          toggleOpen: '_toggleSiderOpen',
                          setOpen: '_setSiderOpen',
                        },
                      }}
                      content={{
                        content: () => (
                          <div style={styles.sider}>
                            <Menu
                              blockId={`${blockId}_menu`}
                              components={{ Icon, Link }}
                              basePath={basePath}
                              events={events}
                              methods={methods}
                              menus={menus}
                              pageId={pageId}
                              properties={mergeObjects([
                                {
                                  mode: 'inline',
                                  theme: get(properties, 'sider.theme') ?? 'light',
                                  // collapsed: !openSiderState,
                                },
                                { style: styles.desktop },
                                properties.menu,
                                properties.menuLg,
                              ])}
                              rename={{
                                methods: {
                                  toggleOpen: 'toggleMobileMenuOpen',
                                  setOpen: 'setMobileMenuOpen',
                                },
                                events: {
                                  onClick: 'onMenuItemClick',
                                  onSelect: 'onMenuItemCSelect',
                                  onToggleMenuGroup: 'onToggleMenuGroup',
                                },
                              }}
                            />
                            <div style={{ flex: '1 0 auto' }}>
                              {content.sider && content.sider()}
                            </div>
                            {!get(properties, 'sider.hideToggleButton') ?? (
                              <Affix
                                blockId={`${blockId}_toggle_sider_affix`}
                                components={{ Icon, Link }}
                                events={events}
                                properties={{ offsetBottom: 0 }}
                                methods={methods}
                                rename={{
                                  events: {
                                    onChange: 'onChangeToggleSiderAffix',
                                  },
                                }}
                                content={{
                                  content: () => (
                                    <div
                                      style={{
                                        background:
                                          get(properties, 'sider.theme') === 'dark'
                                            ? '#30393e'
                                            : 'white',
                                      }}
                                    >
                                      <Button
                                        blockId={`${blockId}_toggle_sider`}
                                        components={{ Icon, Link }}
                                        events={events}
                                        properties={{
                                          hideTitle: true,
                                          type: 'link',
                                          block: true,
                                          icon: {
                                            name: openSiderState
                                              ? 'AiOutlineMenuFold'
                                              : 'AiOutlineMenuUnfold',
                                          },
                                          ...(properties.toggleSiderButton ?? {}),
                                        }}
                                        methods={methods}
                                        onClick={() => methods.toggleSiderOpen()}
                                        rename={{
                                          events: {
                                            onClick: 'onToggleSider',
                                          },
                                        }}
                                      />
                                    </div>
                                  ),
                                }}
                              />
                            )}
                          </div>
                        ),
                      }}
                    />
                    <Content
                      blockId={`${blockId}_content`}
                      components={{ Icon, Link }}
                      events={events}
                      properties={mergeObjects([{ style: styles.body }, properties.content])}
                      content={{
                        content: () => (
                          <>
                            {!type.isNone(properties.breadcrumb) ? (
                              <Breadcrumb
                                blockId={`${blockId}_breadcrumb`}
                                basePath={basePath}
                                components={{ Icon, Link }}
                                events={events}
                                methods={methods}
                                properties={mergeObjects([
                                  { style: styles.breadcrumb },
                                  properties.breadcrumb,
                                ])}
                                rename={{
                                  events: {
                                    onClick: 'onBreadcrumbClick',
                                  },
                                }}
                              />
                            ) : (
                              <div className={methods.makeCssClass(styles.noBreadcrumb)} />
                            )}
                            {content.content && content.content()}
                            {content.footer && (
                              <Footer
                                blockId={`${blockId}_footer`}
                                components={{ Icon, Link }}
                                events={events}
                                properties={properties.footer}
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
          </>
        ),
      }}
    />
  );
};

PageSiderMenu.defaultProps = blockDefaultProps;
PageSiderMenu.meta = {
  category: 'container',
  icons: ['AiOutlineMenuFold', 'AiOutlineMenuUnfold', ...MobileMenu.meta.icons],
  styles: ['blocks/PageSiderMenu/style.less'],
};

export default PageSiderMenu;
