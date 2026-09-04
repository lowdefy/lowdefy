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

import nestSchemaPaths from './nestSchemaPaths.js';

// JSON Schema is the one type vocabulary in Lowdefy config. These names are the
// only sugar on top of it, and they expand to plain JSON Schema so every
// consumer - ajv, the data model tool, an agent reading the artifact - reads
// one dialect. `date` is a serialized ISO-8601 string, not a Date instance:
// schemas describe the JSON shape a value has on the wire.
const SHORTHAND_TYPES = {
  string: { type: 'string' },
  number: { type: 'number' },
  integer: { type: 'integer' },
  boolean: { type: 'boolean' },
  date: { type: 'string', format: 'date-time' },
  object: { type: 'object' },
  array: { type: 'array' },
  null: { type: 'null' },
};

const SHORTHAND_TYPE_NAMES = Object.keys(SHORTHAND_TYPES);

const SCHEMA_MAP_KEYS = ['properties', 'patternProperties', '$defs', 'definitions'];
const SCHEMA_LIST_KEYS = ['anyOf', 'oneOf', 'allOf', 'prefixItems'];
const SCHEMA_KEYS = ['items', 'additionalProperties', 'contains', 'not', 'if', 'then', 'else'];

function expandTypeName(typeName) {
  const expanded = SHORTHAND_TYPES[typeName];
  if (type.isUndefined(expanded)) {
    throw new Error(
      `Unknown type ${JSON.stringify(typeName)}. Accepted types: ${SHORTHAND_TYPE_NAMES.join(
        ', '
      )}.`
    );
  }
  return { ...expanded };
}

function hasDottedKey(map) {
  return Object.keys(map).some((key) => key.includes('.') || key.includes('['));
}

function normalizePropertyMap(map) {
  const normalized = {};
  Object.keys(map).forEach((key) => {
    if (key.startsWith('~')) {
      normalized[key] = map[key];
      return;
    }
    normalized[key] = normalizeSchemaShorthand({ schema: map[key] });
  });
  if (!hasDottedKey(normalized)) {
    return normalized;
  }
  // `properties: { 'address.city': string }` names a nested field the same way
  // a page state contract names a state path, so it nests the same way.
  return nestSchemaPaths({ paths: normalized }).properties;
}

// Expands the Lowdefy schema shorthand into plain JSON Schema. A fragment that
// is already JSON Schema passes through unchanged apart from a `date` type and
// dotted property names.
function normalizeSchemaShorthand({ schema }) {
  if (type.isString(schema)) {
    return expandTypeName(schema);
  }
  if (type.isArray(schema)) {
    if (schema.length !== 1) {
      throw new Error(
        `An array shorthand must hold exactly one entry, eg. [string]. Received ${JSON.stringify(
          schema
        )}.`
      );
    }
    return { type: 'array', items: normalizeSchemaShorthand({ schema: schema[0] }) };
  }
  if (!type.isObject(schema)) {
    return schema;
  }
  const normalized = {};
  Object.keys(schema).forEach((key) => {
    const value = schema[key];
    if (key === 'type' && type.isString(value)) {
      Object.assign(normalized, expandTypeName(value));
      return;
    }
    if (SCHEMA_MAP_KEYS.includes(key) && type.isObject(value)) {
      normalized[key] = normalizePropertyMap(value);
      return;
    }
    if (SCHEMA_LIST_KEYS.includes(key) && type.isArray(value)) {
      normalized[key] = value.map((entry) => normalizeSchemaShorthand({ schema: entry }));
      return;
    }
    if (key === 'items' && type.isArray(value)) {
      normalized[key] = value.map((entry) => normalizeSchemaShorthand({ schema: entry }));
      return;
    }
    if (SCHEMA_KEYS.includes(key)) {
      normalized[key] = normalizeSchemaShorthand({ schema: value });
      return;
    }
    normalized[key] = value;
  });
  return normalized;
}

export { SHORTHAND_TYPE_NAMES };
export default normalizeSchemaShorthand;
