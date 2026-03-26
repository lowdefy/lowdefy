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

import React, { useEffect } from 'react';
import { mergeObjects, type } from '@lowdefy/helpers';
import { withBlockDefaults } from '@lowdefy/block-utils';

import Breadcrumb from '../Breadcrumb/Breadcrumb.js';
import Content from '../Content/Content.js';
import Footer from '../Footer/Footer.js';
import Header from '../Header/Header.js';
import Layout from '../Layout/Layout.js';
import Menu from '../Menu/Menu.js';
import MobileMenu from '../MobileMenu/MobileMenu.js';
import { getDarkMode, renderHeaderActions, registerDarkModeMethod } from '../headerActions.js';

const PageHeaderMenu = ({
  basePath,
  blockId,
  classNames = {},
  components: { Icon, Link, ShortcutBadge },
  content,
  events,
  menus,
  methods,
  pageId,
  properties,
  styles = {},
}) => {
  useEffect(() => {
    registerDarkModeMethod(methods);
  });

  return (
    <Layout
      blockId={blockId}
      events={events}
      components={{ Icon, Link, ShortcutBadge }}
      styles={{
        element: mergeObjects([{ minHeight: '100vh' }, styles.element]),
      }}
      content={{
        content: () => (
          <>
            <Header
              blockId={`${blockId}_header`}
              events={events}
              components={{ Icon, Link, ShortcutBadge }}
              classNames={{ element: classNames.header }}
              properties={{}}
              styles={{
                element: mergeObjects([
                  {
                    background: 'var(--ant-color-bg-container)',
                  },
                  styles.header,
                ]),
              }}
              content={{
                content: () => (
                  <>
                    <Link home={true}>
                      <picture>
                        <source
                          media={`(min-width:${properties.logo?.breakpoint ?? 577}px)`}
                          srcSet={
                            properties.logo?.src ??
                            `${basePath}/logo-${getDarkMode() ? 'dark' : 'light'}-theme.png`
                          }
                        />
                        <img
                          src={
                            properties.logo?.srcMobile ??
                            properties.logo?.src ??
                            `${basePath}/logo-square-${getDarkMode() ? 'dark' : 'light'}-theme.png`
                          }
                          alt={properties.logo?.alt ?? 'Lowdefy'}
                          className={
                            classNames.logo ??
                            'mx-1.5 sm:mx-2.5 md:mx-4 lg:mx-[30px] shrink w-10 sm:w-[130px]'
                          }
                          style={styles.logo}
                        />
                      </picture>
                    </Link>
                    <div className="flex flex-auto items-center justify-end">
                      <div className="hidden lg:flex flex-auto">
                        <Menu
                          blockId={`${blockId}_menu`}
                          basePath={basePath}
                          components={{ Icon, Link, ShortcutBadge }}
                          classNames={{ element: classNames.menu }}
                          events={events}
                          methods={methods}
                          menus={menus}
                          pageId={pageId}
                          properties={mergeObjects([
                            {
                              mode: 'horizontal',
                              collapsed: false,
                            },
                            properties.menu,
                            properties.menuLg,
                          ])}
                          styles={{
                            element: mergeObjects([{ borderBottom: 'none' }, styles.menu]),
                          }}
                          rename={{
                            events: {
                              onClick: 'onMenuItemClick',
                              onSelect: 'onMenuItemSelect',
                              onToggleMenuGroup: 'onToggleMenuGroup',
                            },
                          }}
                        />
                      </div>
                      {content.header &&
                        content.header(
                          mergeObjects([
                            {
                              width: 'auto',
                              flex: '0 1 auto',
                              alignItems: 'center',
                              flexWrap: 'nowrap',
                            },
                            styles.headerContent,
                          ])
                        )}
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
                        basePath={basePath}
                        components={{ Icon, Link, ShortcutBadge }}
                        events={events}
                        methods={methods}
                        menus={menus}
                        pageId={pageId}
                        properties={mergeObjects([properties.menu, properties.menuMd])}
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
                  </>
                ),
              }}
            />
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
                  element: styles.footer,
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
  );
};

export default withBlockDefaults(PageHeaderMenu);
