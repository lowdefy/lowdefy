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
// anyOf and allOf branches, however nested.
function expandSchema(schema) {
  const schemas = [];
  const pending = [schema];
  while (pending.length > 0) {
    const candidate = pending.pop();
    if (type.isObject(candidate)) {
      schemas.push(candidate);
      [...(candidate.oneOf ?? []), ...(candidate.anyOf ?? []), ...(candidate.allOf ?? [])].forEach(
        (branch) => pending.push(branch)
      );
    }
  }
  return schemas;
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
function collectUrlKinds({ value, schema, path }) {
  const kinds = new Map();
  const pending = [{ value, schema, path }];
  while (pending.length > 0) {
    const item = pending.pop();
    const schemas = expandSchema(item.schema);
    const urlKind = findUrlKind(schemas);
    if (urlKind === null) {
      // Another schema branch may already have marked it as a URL.
      if (!kinds.has(item.path)) {
        kinds.set(item.path, null);
      }
    } else if (type.isString(urlKind)) {
      if (type.isArray(item.value)) {
        item.value.forEach((_, index) => kinds.set(`${item.path}.${index}`, urlKind));
      } else {
        kinds.set(item.path, urlKind);
      }
    } else if (type.isArray(item.value)) {
      const itemSchemas = schemas.map((candidate) => candidate.items).filter(type.isObject);
      item.value.forEach((child, index) =>
        itemSchemas.forEach((itemSchema) =>
          pending.push({ value: child, schema: itemSchema, path: `${item.path}.${index}` })
        )
      );
    } else if (type.isObject(item.value)) {
      Object.keys(item.value).forEach((key) => {
        childSchemas({ schemas, key }).forEach((childSchema) =>
          pending.push({ value: item.value[key], schema: childSchema, path: `${item.path}.${key}` })
        );
      });
    }
  }
  return kinds;
}

export default collectUrlKinds;
