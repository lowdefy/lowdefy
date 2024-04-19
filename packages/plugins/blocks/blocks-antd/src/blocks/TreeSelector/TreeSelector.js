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
  return data.map(({ children, disabled, disableCheckbox, label, value }, i) => {
    const key = `${prefix}-${i}`;
    valueMap[key] = prefix ? [value, ...valueMap[prefix]] : [value];
    return {
      children: children && transformData(children, valueMap, key),
      disabled,
      disableCheckbox,
      key,
      renderTitle: label,
    };
  });
};

const getValueKeys = (value, valueMap) => {
  for (const key in valueMap) {
    if (JSON.stringify(value) === JSON.stringify(valueMap[key])) {
      return key
        .split('-')
        .slice(1)
        .reduce((acc, curr, i) => [...acc, acc[i - 1] ? acc[i - 1] + '-' + curr : '-' + curr], []);
    }
  }
  return [];
};

const TreeSelector = ({ blockId, properties, content, methods, value }) => {
  const treeData = properties.options;
  const valueMap = {};
  const transformedData = transformData(treeData, valueMap);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);

  useEffect(() => {
    let nextValue;
    if (value === null || (Array.isArray(value) && !value.length)) {
      nextValue = [];
    } else {
      nextValue = getValueKeys(value, valueMap);
    }
    setSelectedKeys([nextValue[nextValue.length - 1]]);
    setExpandedKeys([...new Set([...nextValue.slice(0, nextValue.length - 1), ...expandedKeys])]);
  }, [value]);

  const onSelect = (selectedKeys) => {
    methods.setValue(selectedKeys.map((key) => valueMap[key]).flat());
    methods.triggerEvent({ name: 'onChange' });
    setSelectedKeys(selectedKeys);
  };

  const onExpand = (nextExpandedKeys) => {
    setExpandedKeys(nextExpandedKeys);
  };

  return (
    <Tree
      id={blockId}
      checkable={properties.checkable}
      disabled={properties.disabled}
      defaultExpandAll={properties.defaultExpandAll}
      showLine={properties.showLine}
      selectable={properties.selectable}
      multiple={false}
      content={content.options && content.options()}
      treeData={transformedData}
      onSelect={onSelect}
      onExpand={onExpand}
      titleRender={({ renderTitle }) => renderHtml({ html: renderTitle, methods })}
      selectedKeys={selectedKeys}
      expandedKeys={expandedKeys}
    />
  );
};

TreeSelector.defaultProps = blockDefaultProps;
TreeSelector.meta = {
  category: 'input',
  valueType: 'array',
  icons: [],
  styles: ['blocks/TreeSelector/style.less'],
};

export default TreeSelector;
