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

// The urlKind the schemas give a value: a string when one marks it as a URL,
// null when one opts it out with urlKind: false, undefined when none says.
function findUrlKind(schemas) {
  const marked = schemas.find((candidate) => type.isString(candidate.urlKind));
  if (marked) {
    return marked.urlKind;
  }
  if (schemas.some((candidate) => candidate.urlKind === false)) {
    return null;
  }
  return undefined;
}

// Records, by path, the urlKind a block schema gives the value there. A block
// marks each URL-valued property with urlKind ('url' and 'href' navigate, 'url'
// the way the engine's link resolver does; 'src' loads; 'srcSet' lists
// sources), so the policy judges URLs by what a property is, not by what it is
// called; a marked array holds one URL per item. urlKind: false records null,
// for a property whose name looks like a URL key but whose value is not a URL.
// A value no schema marks either way is not recorded, so the policy falls back
// to judging it by its key name.
function collectUrlKinds({ value, schema, path, kinds = new Map() }) {
  const schemas = expandSchema(schema);
  const urlKind = findUrlKind(schemas);
  if (urlKind === null) {
    // Another schema branch may already have marked it as a URL.
    if (!kinds.has(path)) {
      kinds.set(path, null);
    }
    return kinds;
  }
  if (type.isString(urlKind)) {
    if (type.isArray(value)) {
      value.forEach((_, index) => kinds.set(`${path}.${index}`, urlKind));
    } else {
      kinds.set(path, urlKind);
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
