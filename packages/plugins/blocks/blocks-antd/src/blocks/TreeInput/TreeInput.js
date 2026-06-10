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

import React, { useState } from 'react';
import { Tree } from 'antd';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import withTheme from '../withTheme.js';
import useSetData from '../../useSetData.js';
import getSelectedIndex from '../../getSelectedIndex.js';
import getSelectorOptions from '../../getSelectorOptions.js';
import { getTreeNodes } from '../../getTreeData.js';

// Inline tree input (antd Tree). Driven by the same model as the tree dropdowns: flat
// `data`/`options` with `primaryKey` (node id) + `parentKey` (parent's id) build the hierarchy,
// `valueKey` is the stored value, `html` renders each node label. Node keys are the flat entry
// index, so selection reuses getSelectorOptions/getSelectedIndex (matched by valueKey — primaryKey
// is structural).
const TreeInput = ({ blockId, classNames = {}, properties, methods, styles = {}, value }) => {
  const data = useSetData({ properties, methods });
  const { treeData } = getTreeNodes({ properties: { ...properties, data } });
  const entries = getSelectorOptions({ properties: { ...properties, data } });
  const matchProps = { ...properties, primaryKey: undefined };
  const selectedIndex = getSelectedIndex(value, entries, { properties: matchProps });
  const selectedKeys = type.isNone(selectedIndex) ? [] : [selectedIndex];

  const [expandedKeys, setExpandedKeys] = useState(undefined);

  const onSelect = (keys) => {
    const idx = keys[0];
    const val = type.isNone(idx) ? null : entries[idx].value;
    methods.setValue(val);
    methods.triggerEvent({ name: 'onChange', event: { value: val } });
  };

  return (
    <Tree
      id={blockId}
      className={classNames.element}
      checkable={properties.checkable}
      disabled={properties.disabled}
      defaultExpandAll={properties.defaultExpandAll}
      showLine={properties.showLine}
      selectable={properties.selectable}
      multiple={false}
      style={styles.element}
      treeData={treeData}
      onSelect={onSelect}
      onExpand={(keys) => setExpandedKeys(keys)}
      titleRender={(node) => renderHtml({ html: `${node.title}`, methods })}
      selectedKeys={selectedKeys}
      {...(expandedKeys === undefined ? {} : { expandedKeys })}
    />
  );
};

export default withTheme('Tree', withBlockDefaults(TreeInput));
