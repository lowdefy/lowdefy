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
import { mergeObjects } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-tools';

import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Content from '../Content/Content';
import Layout from '../Layout/Layout';
import Sider from '../Sider/Sider';

const PageSHCF = ({ blockId, content, properties, methods }) => (
  <Layout
    blockId={blockId}
    methods={methods}
    properties={{ style: mergeObjects([{ minHeight: '100vh' }, properties.style]) }}
    content={{
      content: () => (
        <>
          {content.sider && (
            <Sider
              blockId={`${blockId}_sider`}
              properties={properties.sider}
              methods={methods}
              content={{
                content: () => content.sider(),
              }}
              rename={{
                events: {
                  onClose: 'onSiderClose',
                  onOpen: 'onSiderOpen',
                },
                methods: {
                  toggleOpen: 'toggleSiderOpen',
                  setOpen: 'setSiderOpen',
                },
              }}
            />
          )}
          <Layout
            blockId={`${blockId}_layout`}
            methods={methods}
            properties={properties.main}
            content={{
              content: () => (
                <>
                  {content.header && (
                    <Header
                      blockId={`${blockId}_header`}
                      properties={properties.header}
                      methods={methods}
                      content={{
                        content: () => content.header(),
                      }}
                    />
                  )}
                  {content.content && (
                    <Content
                      blockId={`${blockId}_content`}
                      properties={properties.content}
                      methods={methods}
                      content={{
                        content: () => content.content(),
                      }}
                    />
                  )}
                  {content.footer && (
                    <Footer
                      blockId={`${blockId}_footer`}
                      properties={properties.footer}
                      methods={methods}
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

PageSHCF.defaultProps = blockDefaultProps;

export default PageSHCF;
