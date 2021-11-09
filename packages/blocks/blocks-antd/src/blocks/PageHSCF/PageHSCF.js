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
import { blockDefaultProps } from '@lowdefy/block-utils';

import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Content from '../Content/Content';
import Layout from '../Layout/Layout';
import Sider from '../Sider/Sider';

const PageHSCF = ({ blockId, events, content, properties, methods }) => (
  <Layout
    blockId={blockId}
    events={events}
    properties={{ style: mergeObjects([{ minHeight: '100vh' }, properties.style]) }}
    content={{
      content: () => (
        <>
          {content.header && (
            <Header
              blockId={`${blockId}_header`}
              events={events}
              properties={properties.header}
              content={{
                content: () => content.header(),
              }}
            />
          )}
          <Layout
            blockId={`${blockId}_layout`}
            events={events}
            properties={properties.main}
            content={{
              content: () => (
                <>
                  {content.sider && (
                    <Sider
                      blockId={`${blockId}_sider`}
                      events={events}
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
                  {content.content && (
                    <Content
                      blockId={`${blockId}_content`}
                      events={events}
                      properties={properties.content}
                      content={{
                        content: () => content.content(),
                      }}
                    />
                  )}
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

PageHSCF.defaultProps = blockDefaultProps;

export default PageHSCF;
