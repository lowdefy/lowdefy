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

const COMPOSITION_KEYS = ['anyOf', 'oneOf', 'allOf'];

function isIndexSegment(segment) {
  return /^\d+$/.test(segment) || segment === '$';
}

function walk(node, segments) {
  if (segments.length === 0) return { resolved: true };
  // A node the schema leaves open (no shape declared) accepts any path below it.
  if (!type.isObject(node)) return { resolved: true };

  const compositionKey = COMPOSITION_KEYS.find((key) => type.isArray(node[key]));
  if (compositionKey) {
    const results = node[compositionKey].map((branch) => walk(branch, segments));
    const resolved = results.find((result) => result.resolved);
    if (resolved) return resolved;
    return results[0];
  }

  const [segment, ...rest] = segments;

  if (isIndexSegment(segment) && !type.isObject(node.properties?.[segment])) {
    return walk(node.items, rest);
  }

  if (!type.isObject(node.properties)) {
    return walk(node.additionalProperties, rest);
  }
  if (type.isObject(node.properties[segment])) {
    return walk(node.properties[segment], rest);
  }
  if (type.isObject(node.additionalProperties)) {
    return walk(node.additionalProperties, rest);
  }
  if (node.additionalProperties === true || type.isObject(node.patternProperties)) {
    return { resolved: true };
  }
  return { resolved: false, segment, candidates: Object.keys(node.properties) };
}

// Resolves a dotted config path (as written in _event, _state, _payload ...)
// against a JSON Schema. A schema node that declares properties is a closed
// set unless it opens itself with additionalProperties or patternProperties;
// a node that declares no shape accepts every path below it, so an untyped or
// description-only schema never fails a path.
// Returns { resolved: true } or { resolved: false, segment, candidates }, where
// segment is the first path segment the schema has no room for and candidates
// are the property names declared at that depth.
function resolveSchemaPath({ schema, path }) {
  const segments = path.split(/\.|\[|\]/).filter((segment) => segment !== '');
  return walk(schema, segments);
}

export default resolveSchemaPath;
