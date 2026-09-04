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

function getBlockId(node) {
  if (type.isString(node.blockId)) {
    return node.blockId;
  }
  if (type.isString(node.id)) {
    return node.id;
  }
  return null;
}

function isBlock(node) {
  return type.isString(node.type) && !type.isNone(getBlockId(node));
}

function walk({ node, blockId, entries }) {
  if (type.isArray(node)) {
    node.forEach((item) => walk({ node: item, blockId, entries }));
    return;
  }
  if (!type.isObject(node)) {
    return;
  }
  const currentBlockId = isBlock(node) ? getBlockId(node) : blockId;
  if (type.isString(node['~k'])) {
    entries.push({ blockId: currentBlockId, configKey: node['~k'] });
  }
  Object.keys(node).forEach((key) => {
    if (key.startsWith('~')) {
      return;
    }
    walk({ node: node[key], blockId: currentBlockId, entries });
  });
}

// Every `~k` in a build artifact, attributed to the nearest block that encloses
// it. A page's config is spread over the files `_ref` pulled in, so "which
// blocks does this changed file define" is only answerable key by key — the
// page's own refPath names one file, not all of them. Endpoint artifacts carry
// no blocks, so their entries are attributed to no block.
function collectConfigKeyEntries({ node }) {
  const entries = [];
  walk({ node, blockId: null, entries });
  return entries;
}

export default collectConfigKeyEntries;
