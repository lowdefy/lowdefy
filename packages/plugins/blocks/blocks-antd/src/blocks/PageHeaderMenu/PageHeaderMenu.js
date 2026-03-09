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
import { get, mergeObjects, type } from '@lowdefy/helpers';

import Breadcrumb from '../Breadcrumb/Breadcrumb.js';
import Content from '../Content/Content.js';
import Footer from '../Footer/Footer.js';
import Header from '../Header/Header.js';
import Layout from '../Layout/Layout.js';
import Menu from '../Menu/Menu.js';
import MobileMenu from '../MobileMenu/MobileMenu.js';

const PageHeaderMenu = ({
  basePath,
  blockId,
  classNames = {},
  components: { Icon, Link },
  content,
  events,
  menus,
  methods,
  pageId,
  properties,
  styles = {},
}) => {
  return (
    <Layout
      blockId={blockId}
      events={events}
      components={{ Icon, Link }}
      styles={{
        element: mergeObjects([{ minHeight: '100vh' }, styles.element]),
      }}
      content={{
        content: () => (
          <>
            <Header
              blockId={`${blockId}_header`}
              events={events}
              components={{ Icon, Link }}
              classNames={{ element: classNames.header }}
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
                  <>
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
                          className={
                            classNames.logo ??
                            'mx-1.5 sm:mx-2.5 md:mx-4 lg:mx-[30px] shrink w-10 sm:w-[130px]'
                          }
                          style={mergeObjects([properties.logo?.style, styles.logo])}
                        />
                      </picture>
                    </Link>
                    <div className="flex flex-auto items-center justify-end">
                      <div className="hidden lg:flex flex-auto">
                        <Menu
                          blockId={`${blockId}_menu`}
                          basePath={basePath}
                          components={{ Icon, Link }}
                          classNames={{ element: classNames.menu }}
                          events={events}
                          methods={methods}
                          menus={menus}
                          pageId={pageId}
                          properties={mergeObjects([
                            {
                              mode: 'horizontal',
                              collapsed: false,
                              theme: get(properties, 'header.theme') ?? 'dark',
                            },
                            properties.menu,
                            properties.menuLg,
                          ])}
                          styles={{ element: styles.menu }}
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
                            properties.header?.contentStyle,
                          ])
                        )}
                      <div className="flex lg:hidden shrink pl-4">
                        <MobileMenu
                          blockId={`${blockId}_mobile_menu`}
                          basePath={basePath}
                          components={{ Icon, Link }}
                          events={events}
                          methods={methods}
                          menus={menus}
                          pageId={pageId}
                          properties={mergeObjects([properties.menu, properties.menuMd])}
                        />
                      </div>
                    </div>
                  </>
                ),
              }}
            />
            <Content
              blockId={`${blockId}_content`}
              components={{ Icon, Link }}
              classNames={{ element: classNames.content }}
              events={events}
              properties={properties.content ?? {}}
              styles={{
                element: mergeObjects([
                  {
                    padding: '0 40px 40px 40px',
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
                        components={{ Icon, Link }}
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
                components={{ Icon, Link }}
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
  );
};

PageHeaderMenu.meta = {
  category: 'container',
  icons: [...MobileMenu.meta.icons],
  cssKeys: ['element', 'header', 'logo', 'menu', 'content', 'breadcrumb', 'footer'],
};

export default PageHeaderMenu;
