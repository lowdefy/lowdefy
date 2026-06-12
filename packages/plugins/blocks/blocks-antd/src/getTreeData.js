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

import { get, type } from '@lowdefy/helpers';

import getSelectorOptions from './getSelectorOptions.js';

// Sentinel parent id for top-level nodes, used as antd TreeSelect `treeDataSimpleMode.rootPId`.
export const ROOT_PID = '__lowdefy_tree_root__';

// Turns the flat selector `entries` (from getSelectorOptions) into antd TreeSelect
// `treeDataSimpleMode` nodes. Each entry already carries `label` (an html string) + `value`
// (the stored value) + the spread row fields. The antd node `value` is the entry index string
// (matching the other selectors and getSelectedIndex), so the structural `primaryKey`/`parentKey`
// stay independent of the stored value. A `parentKey` that points at no known node falls back to
// root, so a mis-referenced row stays visible rather than orphaned.
const getTreeData = ({ entries, properties }) => {
  const { primaryKey, parentKey } = properties;
  const hasStructure = type.isString(primaryKey) && type.isString(parentKey);

  const ids = new Set();
  if (hasStructure) {
    entries.forEach((entry) => {
      if (type.isObject(entry)) ids.add(get(entry, primaryKey));
    });
  }

  return entries.map((entry, index) => {
    const isObject = type.isObject(entry);
    const id = hasStructure && isObject ? get(entry, primaryKey) : index;
    let pId = ROOT_PID;
    if (hasStructure && isObject) {
      const rawParent = get(entry, parentKey);
      pId = type.isNone(rawParent) || !ids.has(rawParent) ? ROOT_PID : rawParent;
    }
    return {
      id,
      pId,
      value: `${index}`,
      title: isObject ? entry.label : `${entry}`,
      disabled: isObject ? entry.disabled : undefined,
      selectable: isObject ? entry.selectable : undefined,
    };
  });
};

export default getTreeData;

// Builds antd `Tree` (nested) nodes for the inline TreeInput block, plus a flat `entries` list
// aligned to the node keys (each node `key` is its index in `entries`). Driven by a flat
// `data`/`options` array using `primaryKey`/`parentKey` to assemble the hierarchy (same model as
// the dropdowns). `entries[Number(key)].value` is the stored value for a selected node; selection
// matching reuses getSelectedIndex against `entries`.
export const getTreeNodes = ({ properties }) => {
  const { primaryKey, parentKey } = properties;
  const entries = getSelectorOptions({ properties });
  const nodes = entries.map((entry, index) => ({
    key: `${index}`,
    title: type.isObject(entry) ? entry.label : `${entry}`,
    disabled: type.isObject(entry) ? entry.disabled : undefined,
    disableCheckbox: type.isObject(entry) ? entry.disableCheckbox : undefined,
    selectable: type.isObject(entry) ? entry.selectable : undefined,
  }));

  if (!type.isString(primaryKey) || !type.isString(parentKey)) {
    return { treeData: nodes, entries };
  }

  const byId = {};
  entries.forEach((entry, i) => {
    if (type.isObject(entry)) byId[get(entry, primaryKey)] = nodes[i];
  });
  const roots = [];
  entries.forEach((entry, i) => {
    const parent = type.isObject(entry) ? get(entry, parentKey) : null;
    if (!type.isNone(parent) && byId[parent]) {
      byId[parent].children = byId[parent].children ?? [];
      byId[parent].children.push(nodes[i]);
    } else {
      roots.push(nodes[i]);
    }
  });
  return { treeData: roots, entries };
};
