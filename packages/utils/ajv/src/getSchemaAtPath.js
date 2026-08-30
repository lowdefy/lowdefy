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

function isOpenObject(node) {
  if (node.additionalProperties === false) return false;
  if (!type.isNone(node.enum) || !type.isNone(node.const)) return false;
  // Combinator branches are the member list; a miss in every branch is a miss.
  if (['anyOf', 'oneOf', 'allOf'].some((combinator) => type.isArray(node[combinator]))) {
    return false;
  }
  if (type.isNone(node.type)) return true;
  if (type.isArray(node.type)) return node.type.includes('object');
  return node.type === 'object';
}

function isOpenArray(node) {
  if (type.isArray(node.type)) return node.type.includes('array');
  return node.type === 'array';
}

// One navigation step: the sub-schema that governs `segment` inside `node`,
// or null when the schema says no such member exists.
function stepInto(node, segment) {
  if (!type.isObject(node)) return null;
  if (type.isObject(node.properties) && Object.hasOwn(node.properties, segment)) {
    return node.properties[segment];
  }
  if (isIndexSegment(segment)) {
    if (type.isObject(node.items)) return node.items;
    if (type.isArray(node.items)) {
      return segment !== '$' && type.isObject(node.items[Number(segment)])
        ? node.items[Number(segment)]
        : null;
    }
    // An array with no items schema constrains nothing below it.
    if (isOpenArray(node) && type.isNone(node.items)) return {};
  }
  for (const combinator of ['anyOf', 'oneOf', 'allOf']) {
    if (type.isArray(node[combinator])) {
      for (const branch of node[combinator]) {
        const found = stepInto(branch, segment);
        if (found !== null) return found;
      }
    }
  }
  if (type.isObject(node.additionalProperties)) {
    return node.additionalProperties;
  }
  // A declared `properties` map is the complete member list. Without one, an
  // object-typed (or untyped) fragment leaves its members open.
  if (type.isNone(node.properties) && isOpenObject(node)) {
    return {};
  }
  return null;
}

// Resolves a dotted path against a JSON Schema by walking `properties`,
// `items`, `additionalProperties` and combinator branches. Returns the
// sub-schema at the path ({} when the schema leaves that part open) or null
// when the path is not part of the schema.
function getSchemaAtPath({ schema, path }) {
  const segments = splitSchemaPath(path);
  let node = schema;
  for (const segment of segments) {
    node = stepInto(node, segment);
    if (node === null) return null;
  }
  return type.isObject(node) ? node : null;
}

export default getSchemaAtPath;
