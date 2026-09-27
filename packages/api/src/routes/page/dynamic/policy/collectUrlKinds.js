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

// The schemas that can describe a value: the schema itself and its oneOf,
// anyOf and allOf branches, recursively.
function expandSchema(schema) {
  if (!type.isObject(schema)) {
    return [];
  }
  return [
    schema,
    ...[...(schema.oneOf ?? []), ...(schema.anyOf ?? []), ...(schema.allOf ?? [])].flatMap(
      expandSchema
    ),
  ];
}

function childSchemas({ schemas, key }) {
  return schemas.flatMap((schema) => {
    if (type.isObject(schema.properties?.[key])) {
      return [schema.properties[key]];
    }
    if (type.isObject(schema.additionalProperties)) {
      return [schema.additionalProperties];
    }
    return [];
  });
}

// Records, by path, the urlKind a block schema marks on the value there, or
// null where the schema describes the value without marking it. A block marks
// each URL-valued property with urlKind ('url' and 'href' navigate, 'url' the
// way the engine's link resolver does; 'src' loads; 'srcSet' lists sources), so
// the policy judges URLs by what a property is, not by what it is called. A
// marked array holds one URL per item.
function collectUrlKinds({ value, schema, path, kinds = new Map() }) {
  const schemas = expandSchema(schema);
  if (schemas.length === 0) {
    return kinds;
  }
  const marked = schemas.find((candidate) => type.isString(candidate.urlKind));
  if (!marked) {
    // Another schema branch may already have marked it.
    if (!kinds.has(path)) {
      kinds.set(path, null);
    }
  } else {
    if (type.isArray(value)) {
      value.forEach((_, index) => kinds.set(`${path}.${index}`, marked.urlKind));
    } else {
      kinds.set(path, marked.urlKind);
    }
    return kinds;
  }
  if (type.isArray(value)) {
    const itemSchemas = schemas.map((candidate) => candidate.items).filter(type.isObject);
    value.forEach((item, index) =>
      itemSchemas.forEach((itemSchema) =>
        collectUrlKinds({ value: item, schema: itemSchema, path: `${path}.${index}`, kinds })
      )
    );
    return kinds;
  }
  if (type.isObject(value)) {
    Object.keys(value).forEach((key) => {
      childSchemas({ schemas, key }).forEach((childSchema) =>
        collectUrlKinds({ value: value[key], schema: childSchema, path: `${path}.${key}`, kinds })
      );
    });
  }
  return kinds;
}

export default collectUrlKinds;
