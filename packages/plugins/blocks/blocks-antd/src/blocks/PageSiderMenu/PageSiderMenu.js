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
  homePageId,
  menus,
  methods,
  pageId,
  properties,
}) => {
  const [openSiderState, setSiderOpen] = useState(
    !(properties.sider && properties.sider.initialCollapsed)
  );
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
      sm: { margin: '0 10px 0 0' },
      md: { margin: '0 15px 0 0' },
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
      sm: { padding: '5px 0' },
      md: { padding: '10px 0' },
    },
  };
  return (
    <Layout
      blockId={blockId}
      components={{ Icon, Link }}
      events={events}
      properties={{ style: mergeObjects([{ minHeight: '100vh' }, properties.style]) }}
      content={{
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
                          mergeObjects([
                            { width: 'auto' },
                            properties.header && properties.header.contentStyle,
                          ])
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
                              theme: get(properties, 'sider.theme') || 'light',
                              backgroundColor: get(properties, 'sider.color'),
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
                    <Link href={`${basePath}/${homePageId}`}>
                      <img
                        src={
                          (properties.logo && properties.logo.src) ||
                          (get(properties, 'header.theme') === 'light'
                            ? `${basePath}/public/logo-light-theme.png`
                            : `${basePath}/public/logo-dark-theme.png`)
                        }
                        srcSet={
                          (properties.logo && (properties.logo.srcSet || properties.logo.src)) ||
                          (get(properties, 'header.theme') === 'light'
                            ? `${basePath}/public/logo-square-light-theme.png 40w, ${basePath}/public/logo-light-theme.png 577w`
                            : `${basePath}/public/logo-square-dark-theme.png 40w, ${basePath}/public/logo-dark-theme.png 577w`)
                        }
                        sizes={
                          (properties.logo && properties.logo.sizes) ||
                          '(max-width: 576px) 40px, 577px'
                        }
                        alt={(properties.logo && properties.logo.alt) || 'Lowdefy'}
                        className={methods.makeCssClass([
                          {
                            width: 130,
                            sm: {
                              width:
                                properties.logo && properties.logo.src && !properties.logo.srcSet
                                  ? 130
                                  : 40,
                            },
                            md: { width: 130 },
                          },
                          styles.logo,
                          properties.logo && properties.logo.style,
                        ])}
                      />
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
                          theme: get(properties, 'sider.theme') || 'light',
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
                                  theme: get(properties, 'sider.theme') || 'light',
                                  backgroundColor: get(properties, 'sider.color'),
                                  // collapsed: !openSiderState,
                                },
                                properties.menu,
                                properties.menuLg,
                                { style: styles.desktop },
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
                            {!get(properties, 'sider.hideToggleButton') && (
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
                                          get(properties, 'sider.color') ||
                                          (get(properties, 'sider.theme') === 'dark'
                                            ? '#30393e'
                                            : 'white'),
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
                                              ? 'MenuFoldOutlined'
                                              : 'MenuUnfoldOutlined',
                                          },
                                          ...(properties.toggleSiderButton || {}),
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
                                  { style: { padding: '16px 0' } },
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
  loading: {
    type: 'Spinner',
    properties: {
      height: '100vh',
    },
  },
};
PageSiderMenu.styles = ['blocks/PageSiderMenu/style.less'];

export default PageSiderMenu;
