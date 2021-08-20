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
import { Link } from 'react-router-dom';
import { blockDefaultProps } from '@lowdefy/block-tools';
import { get, mergeObjects, type } from '@lowdefy/helpers';

import Breadcrumb from '../Breadcrumb/Breadcrumb';
import Content from '../Content/Content';
import Footer from '../Footer/Footer';
import Header from '../Header/Header';
import Layout from '../Layout/Layout';
import Menu from '../Menu/Menu';
import MobileMenu from '../MobileMenu/MobileMenu';

const PageHeaderMenu = ({
  basePath,
  blockId,
  content,
  events,
  homePageId,
  menus,
  methods,
  pageId,
  properties,
}) => {
  const styles = {
    layout: {
      minHeight: '100vh',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      padding: '0 46px',
      sm: { padding: '0 15px' },
      md: { padding: '0 30px' },
      lg: { padding: '0 46px' },
    },
    headerContent: {
      display: 'flex',
      flex: '1 1 auto',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    logo: {
      margin: '0px 30px',
      flex: '0 1 auto',
      sm: { margin: '0 10px' },
      md: { margin: '0 15px' },
    },
    lgMenu: {
      flex: '1 1 auto',
      sm: { display: 'none' },
      md: { display: 'none' },
      lg: { display: 'flex' },
    },
    mdMenu: {
      flex: '0 1 auto',
      paddingLeft: '1rem',
      sm: { display: 'flex' },
      md: { display: 'flex' },
      lg: { display: 'none' },
    },
    desktop: {
      display: 'none',
      lg: { display: 'block' },
    },
    mobile: {
      display: 'block',
      lg: { display: 'none' },
    },
    body: {
      padding: '0 40px 40px 40px',
      sm: { padding: '0 10px 10px 10px' },
      md: { padding: '0 20px 20px 20px' },
      lg: { padding: '0 40px 40px 40px' },
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
      events={events}
      properties={{ style: mergeObjects([{ minHeight: '100vh' }, properties.style]) }}
      content={{
        content: () => (
          <>
            <Header
              blockId={`${blockId}_header`}
              events={events}
              properties={mergeObjects([
                {
                  style: styles.header,
                },
                properties.header,
              ])}
              content={{
                content: () => (
                  <>
                    <Link to={`${basePath}/${homePageId}`}>
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
                    <div className={methods.makeCssClass(styles.headerContent)}>
                      <div className={methods.makeCssClass([styles.desktop, styles.lgMenu])}>
                        <Menu
                          blockId={`${blockId}_menu`}
                          basePath={basePath}
                          events={events}
                          methods={methods}
                          menus={menus}
                          pageId={pageId}
                          properties={mergeObjects([
                            {
                              mode: 'horizontal',
                              collapsed: false,
                              theme: get(properties, 'header.theme') || 'dark',
                              backgroundColor: get(properties, 'header.color'),
                            },
                            properties.menu,
                            properties.menuLg,
                          ])}
                        />
                      </div>
                      {content.header &&
                        content.header(
                          mergeObjects([
                            { width: 'auto', flex: '0 1 auto' },
                            properties.header && properties.header.contentStyle,
                          ])
                        )}
                      <div className={methods.makeCssClass([styles.mobile, styles.mdMenu])}>
                        <MobileMenu
                          blockId={`${blockId}_mobile_menu`}
                          basePath={basePath}
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
              events={events}
              properties={mergeObjects([properties.content, { style: styles.body }])}
              content={{
                content: () => (
                  <>
                    {!type.isNone(properties.breadcrumb) ? (
                      <Breadcrumb
                        blockId={`${blockId}_breadcrumb`}
                        basePath={basePath}
                        events={events}
                        methods={methods}
                        properties={mergeObjects([
                          properties.breadcrumb,
                          { style: { padding: '16px 0' } },
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
                  </>
                ),
              }}
            />
            {content.footer && (
              <Footer
                blockId={`${blockId}_footer`}
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
  );
};

PageHeaderMenu.defaultProps = blockDefaultProps;

export default PageHeaderMenu;
