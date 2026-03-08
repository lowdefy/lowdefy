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

const Header = Layout.Header;

const HeaderBlock = ({ blockId, classNames = {}, content, properties, styles = {} }) => (
  <Header
    id={blockId}
    className={classNames.element ? `${classNames.element} hide-on-print` : 'hide-on-print'}
    style={{
      backgroundColor: properties.theme === 'light' ? '#fff' : undefined,
      ...styles.element,
    }}
  >
    {content.content && content.content()}
  </Header>
);

HeaderBlock.meta = {
  category: 'container',
  icons: [],
  cssKeys: ['element'],
};

export default HeaderBlock;
