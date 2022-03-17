/*
  Copyright 2020-2022 Lowdefy, Inc

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
import { blockDefaultProps } from '@lowdefy/block-utils';
import { mergeObjects } from '@lowdefy/helpers';

import Content from '../Content/Content.js';
import Footer from '../Footer/Footer.js';
import Header from '../Header/Header.js';
import Layout from '../Layout/Layout.js';
import Sider from '../Sider/Sider.js';

const PageHCSF = ({ blockId, components, content, events, methods, properties }) => (
  <Layout
    blockId={blockId}
    components={components}
    events={events}
    properties={{ style: mergeObjects([{ minHeight: '100vh' }, properties.style]) }}
    content={{
      content: () => (
        <>
          {content.header && (
            <Header
              blockId={`${blockId}_header`}
              components={components}
              events={events}
              properties={properties.header}
              content={{
                content: () => content.header(),
              }}
            />
          )}
          <Layout
            blockId={`${blockId}_layout`}
            components={components}
            events={events}
            properties={properties.main}
            content={{
              content: () => (
                <>
                  {content.content && (
                    <Content
                      blockId={`${blockId}_content`}
                      components={components}
                      events={events}
                      properties={properties.content}
                      content={{
                        content: () => content.content(),
                      }}
                    />
                  )}
                  {content.sider && (
                    <Sider
                      blockId={`${blockId}_sider`}
                      components={components}
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
                </>
              ),
            }}
          />
          {content.footer && (
            <Footer
              blockId={`${blockId}_footer`}
              components={components}
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

PageHCSF.defaultProps = blockDefaultProps;
PageHCSF.meta = {
  category: 'container',
  loading: {
    type: 'Spinner',
    properties: {
      height: '100vh',
    },
  },
  icons: [],
  styles: ['blocks/PageHCSF/style.less'],
};

export default PageHCSF;
