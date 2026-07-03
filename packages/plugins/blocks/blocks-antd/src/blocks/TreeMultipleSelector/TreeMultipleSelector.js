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
import { TreeSelect } from 'antd';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import Label from '../Label/Label.js';
import withTheme from '../withTheme.js';
import useSelectorOptions from '../../useSelectorOptions.js';
import getSelectedIndex from '../../getSelectedIndex.js';
import getTreeData, { ROOT_PID } from '../../getTreeData.js';

const SHOW_STRATEGY = {
  SHOW_ALL: TreeSelect.SHOW_ALL,
  SHOW_PARENT: TreeSelect.SHOW_PARENT,
  SHOW_CHILD: TreeSelect.SHOW_CHILD,
};

const TreeMultipleSelector = ({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  loading,
  methods,
  properties,
  required,
  styles = {},
  validation,
  value,
}) => {
  const [elementId] = useState((0 | (Math.random() * 9e2)) + 1e2);
  const entries = useSelectorOptions({ properties, methods });
  const treeData = getTreeData({ entries, properties });
  // primaryKey / parentKey are structural; selection is matched on valueKey (the stored value).
  const matchProps = { ...properties, primaryKey: undefined };
  const selectedIndices = loading
    ? []
    : getSelectedIndex(value, entries, { properties: matchProps, multiple: true }).filter(
        (i) => i !== undefined
      );

  let antdVariant = properties.variant;
  if (properties.bordered === false) antdVariant = 'borderless';

  return (
    <Label
      blockId={blockId}
      methods={methods}
      classNames={classNames}
      components={{ Icon }}
      events={events}
      properties={{ title: properties.title, size: properties.size, ...properties.label }}
      required={required}
      styles={styles}
      validation={validation}
      content={{
        content: () => (
          <div style={{ width: '100%' }}>
            <div id={`${blockId}_${elementId}_popup`} />
            <TreeSelect
              id={`${blockId}_input`}
              variant={antdVariant}
              className={classNames.element}
              style={{ width: '100%', ...styles.element }}
              disabled={properties.disabled || loading}
              allowClear={properties.allowClear !== false}
              placeholder={
                properties.placeholder ??
                methods.translate('blocks.treeMultipleSelector.placeholder')
              }
              status={validation.status}
              size={properties.size}
              autoFocus={properties.autoFocus}
              maxTagCount={properties.maxTagCount}
              getPopupContainer={() => document.getElementById(`${blockId}_${elementId}_popup`)}
              treeDataSimpleMode={{ id: 'id', pId: 'pId', rootPId: ROOT_PID }}
              treeData={treeData}
              treeDefaultExpandAll={properties.treeDefaultExpandAll}
              showSearch={properties.showSearch !== false}
              treeNodeFilterProp="title"
              treeTitleRender={(node) => renderHtml({ html: `${node.title}`, methods })}
              notFoundContent={
                properties.notFoundContent ??
                methods.translate('blocks.treeMultipleSelector.notFound')
              }
              showCheckedStrategy={SHOW_STRATEGY[properties.showCheckedStrategy] ?? TreeSelect.SHOW_CHILD}
              {...(properties.checkable ? { treeCheckable: true } : { multiple: true })}
              suffixIcon={
                properties.suffixIcon && (
                  <Icon
                    blockId={`${blockId}_suffixIcon`}
                    classNames={{ element: classNames.suffixIcon }}
                    events={events}
                    properties={properties.suffixIcon}
                    styles={{ element: styles.suffixIcon }}
                  />
                )
              }
              clearIcon={
                properties.clearIcon && (
                  <Icon
                    blockId={`${blockId}_clearIcon`}
                    classNames={{ element: classNames.clearIcon }}
                    events={events}
                    properties={properties.clearIcon}
                    styles={{ element: styles.clearIcon }}
                  />
                )
              }
              value={selectedIndices}
              onChange={(idxArr) => {
                const val = (idxArr ?? []).map((i) => entries[i].value);
                methods.setValue(val);
                methods.triggerEvent({ name: 'onChange', event: { value: val } });
              }}
              onBlur={() => methods.triggerEvent({ name: 'onBlur' })}
              onFocus={() => methods.triggerEvent({ name: 'onFocus' })}
              onClear={() => methods.triggerEvent({ name: 'onClear' })}
              onSearch={(v) => methods.triggerEvent({ name: 'onSearch', event: { value: v } })}
            />
          </div>
        ),
      }}
    />
  );
};

export default withTheme('TreeSelect', withBlockDefaults(TreeMultipleSelector));
