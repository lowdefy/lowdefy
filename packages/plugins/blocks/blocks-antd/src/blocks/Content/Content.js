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
import { Layout } from 'antd';
import { withBlockDefaults } from '@lowdefy/block-utils';

const Content = Layout.Content;

const ContentBlock = ({ blockId, classNames = {}, content, properties, styles = {} }) => (
  <Content
    id={blockId}
    className={classNames.element}
    style={{ flex: '1 1 auto', minWidth: 0, ...styles.element }}
  >
    {content.content && content.content({ flexDirection: 'column', flex: '1 1 auto' })}
  </Content>
);

export default withBlockDefaults(ContentBlock);
