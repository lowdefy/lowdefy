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

import splitSchemaPath from './splitSchemaPath.js';

function isIndexSegment(segment) {
  return segment === '$' || /^\d+$/.test(segment);
}

function childContainer(node, segment) {
  if (isIndexSegment(segment)) {
    return { holder: node, key: 'items' };
  }
  if (!type.isObject(node.properties)) {
    node.properties = {};
  }
  return { holder: node.properties, key: segment };
}

// `~`-prefixed keys (~k, ~r) are Lowdefy build metadata, not schema.
function withoutMetaKeys(fragment) {
  if (type.isArray(fragment)) {
    return fragment.map((item) => withoutMetaKeys(item));
  }
  if (!type.isObject(fragment)) {
    return fragment;
  }
  const copy = {};
  Object.keys(fragment).forEach((key) => {
    if (key.startsWith('~')) return;
    copy[key] = withoutMetaKeys(fragment[key]);
  });
  return copy;
}

function inferType(nextSegment) {
  return isIndexSegment(nextSegment) ? 'array' : 'object';
}

// Turns a map of dotted paths to JSON Schema fragments into one root object
// schema, so `{ 'data.address': A, 'data.status': B }` becomes
// { type: object, properties: { data: { type: object, properties: { address: A, status: B } } } }.
// Intermediate nodes the map never names are typed object (or array before an
// index segment). A named path whose fragment already exists as an
// intermediate node merges the fragment over it. Shallower paths are applied
// first so a parent fragment never overwrites the children nested under it.
function nestSchemaPaths({ paths }) {
  const root = { type: 'object', properties: {} };
  const entries = Object.entries(paths ?? {})
    .filter(([path]) => !path.startsWith('~'))
    .sort(([a], [b]) => splitSchemaPath(a).length - splitSchemaPath(b).length);
  for (const [path, fragment] of entries) {
    const segments = splitSchemaPath(path);
    if (segments.length === 0) continue;
    let node = root;
    segments.forEach((segment, index) => {
      const { holder, key } = childContainer(node, segment);
      const isLeaf = index === segments.length - 1;
      if (!type.isObject(holder[key])) {
        holder[key] = isLeaf ? {} : { type: inferType(segments[index + 1]) };
      }
      if (isLeaf) {
        holder[key] = { ...holder[key], ...withoutMetaKeys(fragment) };
      }
      node = holder[key];
    });
  }
  return root;
}

export default nestSchemaPaths;
