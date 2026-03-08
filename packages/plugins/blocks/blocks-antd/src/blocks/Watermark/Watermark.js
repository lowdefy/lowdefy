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
import { Watermark } from 'antd';

import withTheme from '../withTheme.js';

const WatermarkBlock = ({ blockId, classNames = {}, content, properties, styles = {} }) => (
  <Watermark
    id={blockId}
    className={classNames.element}
    style={styles.element}
    content={properties.text}
    font={properties.font}
    gap={properties.gap}
    offset={properties.offset}
    rotate={properties.rotate}
    zIndex={properties.zIndex}
    width={properties.width}
    height={properties.height}
  >
    {content.content && content.content()}
  </Watermark>
);

WatermarkBlock.meta = {
  category: 'container',
  icons: [],
  cssKeys: ['element'],
};

export default withTheme('Watermark', WatermarkBlock);
