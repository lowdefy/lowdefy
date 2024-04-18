/*
  Copyright 2020-2024 Lowdefy, Inc

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

import React, { useState, useEffect } from 'react';
import { Tree } from 'antd';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';

const transformData = (data, valueMap, prefix = '') => {
  return data.map(({ children, disabled, label, value }, i) => {
    const key = `${prefix}-${i}`;
    valueMap[key] = prefix ? [...valueMap[prefix], value] : [value];
    return {
      children: children && transformData(children, valueMap, key),
      disabled,
      key,
      renderTitle: label,
    };
  });
};

const TreeSelector = ({ blockId, properties, content, methods, value }) => {
  const treeData = properties.options;
  const valueMap = {};
  const transformedData = transformData(treeData, valueMap);
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    if (JSON.stringify(value) === JSON.stringify(selectedKey)) {
      setSelectedKey(value);
      methods.triggerEvent({ name: 'onChange' });
    }
  }, [value]);

  const onSelect = (selected) => {
    const nextValue = selected
      .map((key) => valueMap[key])
      .flat()
      .reverse();
    if (nextValue.length === 0 || nextValue[0] === undefined) {
      methods.setValue(null);
      methods.triggerEvent({ name: 'onChange' });
      setSelectedKey(null);
      return;
    }
    methods.setValue(nextValue[0]);
    methods.triggerEvent({ name: 'onChange' });
    setSelectedKey(nextValue[0]);
  };
  return (
    <Tree
      id={blockId}
      checkable={properties.checkable}
      disabled={properties.disabled}
      defaultExpandAll={properties.defaultExpandAll}
      showLine={true}
      content={content.options && content.options()}
      treeData={transformedData}
      onSelect={onSelect}
      titleRender={({ renderTitle }) => renderHtml({ html: renderTitle, methods })}
      selectedKeys={selectedKey}
    />
  );
};

TreeSelector.defaultProps = blockDefaultProps;
TreeSelector.meta = {
  category: 'input',
  valueType: 'any',
  icons: ['AiOutlineDown', 'AiOutlineRight'],
  styles: ['blocks/TreeSelector/style.less'],
};

export default TreeSelector;
