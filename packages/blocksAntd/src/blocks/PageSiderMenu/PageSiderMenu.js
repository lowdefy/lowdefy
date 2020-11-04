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
import { Link } from 'react-router-dom';
import { get, mergeObjects, type } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-tools';

import Breadcrumb from '../Breadcrumb/Breadcrumb';
import Content from '../Content/Content';
import Footer from '../Footer/Footer';
import Header from '../Header/Header';
import Layout from '../Layout/Layout';
import Menu from '../Menu/Menu';
import MobileMenu from '../MobileMenu/MobileMenu';
import Sider from '../Sider/Sider';
import UserAvatar from '../UserAvatar/UserAvatar';

const PageSiderMenu = ({
  blockId,
  content,
  homePageId,
  menus,
  methods,
  pageId,
  properties,
  user,
}) => {
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
      width: 130,
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
      properties={{ style: mergeObjects([{ minHeight: '100vh' }, properties.style]) }}
      methods={methods}
      content={{
        content: () => (
          <>
            <Header
              methods={methods}
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
                          methods={methods}
                          menus={menus}
                          pageId={pageId}
                          user={user}
                          properties={mergeObjects([
                            {
                              userAvatar: properties.userAvatar,
                            },
                            properties.menu,
                            properties.menuMd,
                          ])}
                        />
                      </div>
                      <div className={methods.makeCssClass(styles.desktop)}>
                        <UserAvatar
                          methods={methods}
                          user={user}
                          properties={mergeObjects([
                            {
                              showName: 'left',
                              theme: get(properties, 'header.theme') || 'dark',
                            },
                            properties.userAvatar,
                          ])}
                        />
                      </div>
                    </div>
                    <Link to={`${homePageId}`}>
                      <img
                        src={
                          properties.logoSrc ||
                          (get(properties, 'header.theme') === 'light'
                            ? 'https://lowdefy.com/logos/name_250.png'
                            : 'https://lowdefy.com/logos/box_white_250.png')
                        }
                        alt={properties.logoAlt || 'Lowdefy'}
                        className={methods.makeCssClass([
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
              properties={properties.layout}
              methods={methods}
              content={{
                content: () => (
                  <>
                    <Sider
                      methods={methods}
                      properties={mergeObjects([
                        {
                          theme: get(properties, 'sider.theme') || 'light',
                          style: styles.desktop,
                        },
                        properties.sider,
                      ])}
                      content={{
                        content: () => (
                          <>
                            <Menu
                              methods={methods}
                              menus={menus}
                              pageId={pageId}
                              properties={mergeObjects([
                                {
                                  mode: 'inline',
                                  collapsed: false,
                                  theme: get(properties, 'sider.theme') || 'light',
                                  backgroundColor: get(properties, 'sider.color'),
                                },
                                properties.menu,
                                styles.desktop,
                              ])}
                            />
                            {content.sider && content.sider()}
                          </>
                        ),
                      }}
                    />
                    <Content
                      methods={methods}
                      properties={mergeObjects([{ style: styles.body }, properties.content])}
                      content={{
                        content: () => (
                          <>
                            {!type.isNone(properties.breadcrumb) ? (
                              <Breadcrumb
                                methods={methods}
                                properties={mergeObjects([
                                  { style: { padding: '16px 0' } },
                                  properties.breadcrumb,
                                ])}
                              />
                            ) : (
                              <div className={methods.makeCssClass(styles.noBreadcrumb)} />
                            )}
                            {content.content && content.content()}
                            {content.footer && (
                              <Footer
                                methods={methods}
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

export default PageSiderMenu;
