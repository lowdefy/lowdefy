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
    valueMap[key] = prefix ? [...valueMap[prefix], value] : [value];
    return {
      children: children && transformData(children, valueMap, key),
      disabled,
      disableCheckbox,
      key,
      renderTitle: label,
    };
  });
};

const getValueKey = (value, valueMap) => {
  for (const key in valueMap) {
    if (JSON.stringify(value) === JSON.stringify(valueMap[key])) {
      return key;
    }
  }
  return null;
};

const TreeSelector = ({ blockId, properties, content, methods, value }) => {
  const treeData = properties.options;
  const valueMap = {};
  const transformedData = transformData(treeData, valueMap);
  const [selectedKeys, setSelectedKeys] = useState([]);

  useEffect(() => {
    if (value === null || (Array.isArray(value) && !value.length)) {
      setSelectedKeys(null);
    } else {
      setSelectedKeys([getValueKey(value, valueMap)]);
    }
  }, [value]);

  const onSelect = (selectedKeys) => {
    methods.setValue(selectedKeys.map((key) => valueMap[key]).flat());
    methods.triggerEvent({ name: 'onChange' });
    setSelectedKeys(selectedKeys);
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
      titleRender={({ renderTitle }) => renderHtml({ html: renderTitle, methods })}
      selectedKeys={selectedKeys}
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
