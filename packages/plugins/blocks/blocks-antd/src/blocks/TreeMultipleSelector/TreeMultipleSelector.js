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
  // antd only shows its loading indicator when no suffixIcon is passed, so swap ours for a spinner.
  const suffixIcon = loading ? (
    <Icon
      blockId={`${blockId}_loadingIcon`}
      properties={{ name: 'loading', spin: true, title: '' }}
    />
  ) : (
    <Icon
      blockId={`${blockId}_suffixIcon`}
      classNames={{ element: classNames.suffixIcon }}
      events={events}
      properties={properties.suffixIcon ?? { name: 'chevron-down', title: '' }}
      styles={{ element: styles.suffixIcon }}
    />
  );

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
              classNames={{ content: classNames.selector, popup: { root: classNames.popup } }}
              style={{ width: '100%', ...styles.element }}
              styles={{ content: styles.selector, popup: { root: styles.popup } }}
              disabled={properties.disabled || loading}
              placeholder={
                properties.placeholder ??
                methods.translate('blocks.treeMultipleSelector.placeholder')
              }
              status={validation.status}
              // antd 6 names the default size `medium`; `default` is not an antd size.
              size={properties.size === 'default' ? 'medium' : properties.size}
              autoFocus={properties.autoFocus}
              listHeight={properties.listHeight}
              loading={loading}
              maxCount={properties.maxCount}
              maxTagCount={properties.maxTagCount}
              placement={properties.placement}
              popupMatchSelectWidth={properties.popupMatchSelectWidth}
              prefix={
                properties.prefix ??
                (properties.prefixIcon && (
                  <Icon
                    blockId={`${blockId}_prefixIcon`}
                    classNames={{ element: classNames.prefixIcon }}
                    events={events}
                    properties={properties.prefixIcon}
                    styles={{ element: styles.prefixIcon }}
                  />
                ))
              }
              getPopupContainer={() => document.getElementById(`${blockId}_${elementId}_popup`)}
              treeDataSimpleMode={{ id: 'id', pId: 'pId', rootPId: ROOT_PID }}
              treeData={treeData}
              treeDefaultExpandAll={properties.treeDefaultExpandAll}
              treeExpandAction={properties.treeExpandAction}
              treeLine={properties.treeLine}
              showSearch={
                properties.showSearch !== false && {
                  autoClearSearchValue: properties.autoClearSearchValue,
                  treeNodeFilterProp: 'title',
                  onSearch: (searchValue) =>
                    methods.triggerEvent({ name: 'onSearch', event: { value: searchValue } }),
                }
              }
              treeTitleRender={(node) => renderHtml({ html: `${node.title}`, methods })}
              notFoundContent={
                properties.notFoundContent ??
                methods.translate('blocks.treeMultipleSelector.notFound')
              }
              showCheckedStrategy={
                SHOW_STRATEGY[properties.showCheckedStrategy] ?? TreeSelect.SHOW_CHILD
              }
              {...(properties.checkable
                ? { treeCheckable: true, treeCheckStrictly: properties.checkStrictly }
                : { multiple: true })}
              suffixIcon={suffixIcon}
              allowClear={
                properties.allowClear !== false && {
                  clearIcon: (
                    <Icon
                      blockId={`${blockId}_clearIcon`}
                      classNames={{ element: classNames.clearIcon }}
                      events={events}
                      properties={properties.clearIcon ?? { name: 'clear', title: '' }}
                      styles={{ element: styles.clearIcon }}
                    />
                  ),
                }
              }
              removeIcon={
                <Icon
                  blockId={`${blockId}_removeIcon`}
                  classNames={{ element: classNames.removeIcon }}
                  events={events}
                  properties={properties.removeIcon ?? { name: 'close', title: '' }}
                  styles={{ element: styles.removeIcon }}
                />
              }
              value={selectedIndices}
              onChange={(idxArr) => {
                // checkStrictly makes antd report { label, value } objects instead of values.
                const val = (idxArr ?? []).map(
                  (i) => entries[type.isObject(i) ? i.value : i].value
                );
                methods.setValue(val);
                methods.triggerEvent({ name: 'onChange', event: { value: val } });
              }}
              onBlur={() => methods.triggerEvent({ name: 'onBlur' })}
              onFocus={() => methods.triggerEvent({ name: 'onFocus' })}
              onClear={() => methods.triggerEvent({ name: 'onClear' })}
              onOpenChange={(open) =>
                methods.triggerEvent({ name: 'onOpenChange', event: { open } })
              }
              // An undefined `virtual` would override ConfigProvider's, so pass it only when set.
              {...(type.isNone(properties.virtual) ? {} : { virtual: properties.virtual })}
            />
          </div>
        ),
      }}
    />
  );
};

export default withTheme(['TreeSelect', 'Select'], withBlockDefaults(TreeMultipleSelector));
