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

// Splits a dotted config path into segments, treating a bracketed index as
// its own segment: 'results[0].title' -> ['results', '0', 'title'].
function splitPath(path) {
  return path.split(/[.[\]]+/).filter((segment) => segment !== '');
}

function declaredKeys(schema) {
  if (!type.isObject(schema) || !type.isObject(schema.properties)) {
    return [];
  }
  return Object.keys(schema.properties).sort();
}

// Whether a single segment can be read from a schema node, and the schema of
// what it reads. A node without a closed shape (no properties, or
// additionalProperties left open, or a composition that offers no fixed
// properties) resolves anything: the check reports only what the schema
// definitely rules out.
function stepInto({ schema, segment }) {
  if (!type.isObject(schema)) {
    return { resolved: true, schema: undefined };
  }
  const branches = [schema.anyOf, schema.oneOf, schema.allOf].find((list) => type.isArray(list));
  if (branches) {
    const results = branches.map((branch) => stepInto({ schema: branch, segment }));
    const resolved = results.find((result) => result.resolved);
    // When no branch has room for the segment, report the first branch's
    // candidates so the suggestion still names something the author can use.
    return resolved ?? results[0] ?? { resolved: false };
  }
  if (type.isObject(schema.properties)) {
    if (segment in schema.properties) {
      return { resolved: true, schema: schema.properties[segment] };
    }
    // An additionalProperties sub-schema shapes every undeclared key, so the
    // path is checked against it; `true` or patternProperties leave it open.
    if (type.isObject(schema.additionalProperties)) {
      return { resolved: true, schema: schema.additionalProperties };
    }
    if (schema.additionalProperties === true || type.isObject(schema.patternProperties)) {
      return { resolved: true, schema: undefined };
    }
    return { resolved: false, candidates: Object.keys(schema.properties).sort() };
  }
  if (type.isObject(schema.additionalProperties)) {
    return { resolved: true, schema: schema.additionalProperties };
  }
  if (schema.type === 'array' || !type.isUndefined(schema.items)) {
    // `.length` is a valid read on any array (as it is in the expression grammar).
    if (segment === 'length') {
      return { resolved: true, schema: { type: 'integer' } };
    }
    // A List template addresses its item as `$`; a literal index is a number.
    if (!/^\d+$/.test(segment) && segment !== '$') {
      return { resolved: false };
    }
    return { resolved: true, schema: type.isObject(schema.items) ? schema.items : undefined };
  }
  // No string `.length`: the path reader (get) does not traverse into strings,
  // so `field.length` on a string-typed field returns null at runtime — the
  // check must flag it (expression grammar §4.5; string length is
  // _string.length's job).
  const primitive = ['string', 'number', 'integer', 'boolean', 'null'];
  if (primitive.includes(schema.type)) {
    return { resolved: false };
  }
  return { resolved: true, schema: undefined };
}

// Resolves a dotted path against a JSON Schema's properties/items. Returns
// { resolved, declared } where declared lists the top-level property names of
// the schema for the error message; an unresolved result also names the
// failing segment and the candidates declared beside it, for the suggestion.
function resolveSchemaPath({ schema, path }) {
  const declared = declaredKeys(schema);
  let current = schema;
  for (const segment of splitPath(path)) {
    const next = stepInto({ schema: current, segment });
    if (!next.resolved) {
      return { resolved: false, declared, segment, candidates: next.candidates ?? [] };
    }
    current = next.schema;
    if (type.isUndefined(current)) {
      return { resolved: true, declared };
    }
  }
  return { resolved: true, declared };
}

export default resolveSchemaPath;
