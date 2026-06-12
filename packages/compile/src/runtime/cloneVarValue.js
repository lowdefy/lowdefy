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

import { type } from '@lowdefy/helpers';

import { setHidden } from './mark.js';

// Walker cloneVarValue parity: every var injection deep-clones (no shared
// structures across injection sites) and re-tags ~r with the providing ref
// when given; a null sourceRefId preserves the template's own markers.
function cloneDeep(node, sourceRefId) {
  if (!type.isObject(node) && !type.isArray(node)) return node;
  let clone;
  if (type.isArray(node)) {
    clone = node.map((item) => cloneDeep(item, sourceRefId));
    if (node['~arr'] !== undefined) setHidden(clone, '~arr', node['~arr']);
  } else {
    clone = {};
    for (const key of Object.keys(node)) {
      clone[key] = cloneDeep(node[key], sourceRefId);
    }
  }
  if (node['~r'] !== undefined) {
    setHidden(clone, '~r', node['~r']);
  } else if (sourceRefId) {
    setHidden(clone, '~r', sourceRefId);
  }
  if (node['~l'] !== undefined) setHidden(clone, '~l', node['~l']);
  if (node['~k'] !== undefined) setHidden(clone, '~k', node['~k']);
  // S2a lexical key id: every injection site carries the template's id —
  // addKeys disambiguates instances with a deterministic tree-order suffix.
  if (node['~lk'] !== undefined) setHidden(clone, '~lk', node['~lk']);
  return clone;
}

function cloneVarValue(value, sourceRefId) {
  if (!type.isObject(value) && !type.isArray(value)) return value;
  return cloneDeep(value, sourceRefId);
}

export default cloneVarValue;
