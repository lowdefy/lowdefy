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
import { get, mergeObjects, type } from '@lowdefy/helpers';

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
              properties={mergeObjects([
                {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 46px',
                    flexDirection: 'row-reverse',
                  },
                },
                properties.header,
              ])}
              styles={{
                element: {
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: 'row-reverse',
                },
              }}
              content={{
                content: () => (
                  <>
                    <div className="flex flex-auto items-center justify-end">
                      {content.header &&
                        content.header(
                          mergeObjects([{ width: 'auto' }, properties.header?.contentStyle])
                        )}
                      <div className="block lg:hidden pl-4">
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
                          className="mr-[30px] shrink w-10 sm:w-[130px] mx-1.5 sm:mx-2.5 md:mx-4"
                          style={properties.logo?.style}
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
                        },
                        properties.sider,
                      ])}
                      classNames={{ element: 'hidden lg:block' }}
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
                                },
                                properties.menu,
                                properties.menuLg,
                              ])}
                              classNames={{ element: 'hidden lg:block' }}
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
                      properties={mergeObjects([
                        {
                          style: {
                            padding: '0 40px 40px 40px',
                          },
                        },
                        properties.content,
                      ])}
                      styles={{
                        element: {
                          padding: '0 40px 40px 40px',
                        },
                      }}
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
                                  { style: { margin: '16px 0' } },
                                  properties.breadcrumb,
                                ])}
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

PageSiderMenu.meta = {
  category: 'container',
  icons: ['AiOutlineMenuFold', 'AiOutlineMenuUnfold', ...MobileMenu.meta.icons],
  cssKeys: ['element'],
};

export default PageSiderMenu;
