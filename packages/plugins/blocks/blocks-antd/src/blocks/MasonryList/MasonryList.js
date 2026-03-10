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
import { Masonry } from 'antd';

import withTheme from '../withTheme.js';

const MasonryListBlock = ({ blockId, classNames = {}, list, methods, properties, styles = {} }) => {
  useEffect(() => {
    methods.registerMethod('pushItem', methods.pushItem);
    methods.registerMethod('removeItem', methods.removeItem);
    methods.registerMethod('unshiftItem', methods.unshiftItem);
    methods.registerMethod('moveItemUp', methods.moveItemUp);
    methods.registerMethod('moveItemDown', methods.moveItemDown);
  });
  const items = (list || []).map((item, i) => ({
    key: `${blockId}_${i}`,
    children: item.content && item.content(),
  }));
  return (
    <Masonry
      id={blockId}
      className={classNames.element}
      style={styles.element}
      columns={properties.columns}
      fresh={properties.fresh}
      gutter={properties.gutter}
      sequential={properties.sequential}
      items={items}
    />
  );
};

MasonryListBlock.meta = {
  valueType: 'array',
  category: 'list',
  icons: [],
  cssKeys: ['element'],
};

export default withTheme('Masonry', MasonryListBlock);
