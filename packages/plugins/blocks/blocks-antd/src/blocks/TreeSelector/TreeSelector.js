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
  return data.map(({ label, value, children }, i) => {
    const key = `${prefix}-${i}`;
    valueMap[key] = prefix ? [...valueMap[prefix], value] : [value];
    return {
      title: label.replace(/(<([^>]+)>)/gi, ' ').trim(),
      renderTitle: label,
      key,
      children: children && transformData(children, valueMap, key),
    };
  });
};

const TreeSelector = ({
  blockId,
  properties,
  content,
  events,
  methods,
  components: { Icon },
  value,
}) => {
  const treeData = properties.options;
  const valueMap = {};
  const transformedData = transformData(treeData, valueMap);
  const [selectedKeys, setSelectedKeys] = useState([]);

  useEffect(() => {
    if (value === null || (Array.isArray(value) && !value.length)) {
      setSelectedKeys(null);
    }
  }, [value]);

  const onSelect = (selectedKeys) => {
    methods.setValue(
      selectedKeys
        .map((key) => valueMap[key])
        .flat()
        .reverse()
    );
    methods.triggerEvent({ name: 'onChange' });
    setSelectedKeys(selectedKeys);
  };
  const [expandedKeys, setExpandedKeys] = useState([]);
  return (
    <Tree
      id={blockId}
      checkable={properties.checkable}
      disabled={properties.disabled}
      defaultExpandAll={properties.defaultExpandAll}
      showLine={true}
      // if expanded switcherIcon AiOutlineDown, otherwise, AiOutlineRight
      switcherIcon={
        <Icon
          blockId={`${blockId}_switcherIcon`}
          events={events}
          properties={expandedKeys.length > 0 ? 'AiOutlineDown' : 'AiOutlineRight'}
        />
      }
      content={content.options && content.options()}
      treeData={transformedData}
      onSelect={onSelect}
      onExpand={(expandedKeys) => {
        setExpandedKeys(expandedKeys);
      }}
      titleRender={({ renderTitle }) => renderHtml({ html: renderTitle, methods })}
      selectedKeys={selectedKeys}
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
