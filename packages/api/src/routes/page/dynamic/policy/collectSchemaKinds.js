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

// The kind the schemas give a value under keyword: a string when one marks it,
// null when one opts it out with false, undefined when none says.
function findKind({ schemas, keyword }) {
  const marked = schemas.find((candidate) => type.isString(candidate[keyword]));
  if (marked) {
    return marked[keyword];
  }
  if (schemas.some((candidate) => candidate[keyword] === false)) {
    return null;
  }
  return undefined;
}

// Records, by path, the kind a block schema gives the value there under one
// keyword, so the policy judges a value by what its property is, not by what it
// is called. A marked array holds one value of that kind per item; false records
// null; a value no schema marks either way is not recorded.
//
// urlKind marks URL-valued properties ('url' and 'href' navigate, 'url' the way
// the engine's link resolver does; 'src' loads; 'srcSet' lists sources), and
// urlKind: false a property whose name looks like a URL key but whose value is
// not a URL. textKind marks how a block draws a string: 'html' through
// renderHtml (sanitised HTML, never markdown or a link), 'text' as escaped
// text. Values neither marks fall back to the key-name and text rules.
function collectSchemaKinds({ value, schema, path, keyword }) {
  const kinds = new Map();
  const pending = [{ value, schema, path }];
  while (pending.length > 0) {
    const item = pending.pop();
    const schemas = expandSchema(item.schema);
    const kind = findKind({ schemas, keyword });
    if (kind === null) {
      // Another schema branch may already have marked it.
      if (!kinds.has(item.path)) {
        kinds.set(item.path, null);
      }
    } else if (type.isString(kind) && type.isArray(item.value)) {
      item.value.forEach((_, index) => kinds.set(`${item.path}.${index}`, kind));
    } else if (type.isString(kind) && !type.isObject(item.value)) {
      kinds.set(item.path, kind);
    } else if (type.isArray(item.value)) {
      const itemSchemas = schemas.map((candidate) => candidate.items).filter(type.isObject);
      item.value.forEach((child, index) =>
        itemSchemas.forEach((itemSchema) =>
          pending.push({ value: child, schema: itemSchema, path: `${item.path}.${index}` })
        )
      );
    } else if (type.isObject(item.value)) {
      // An object under a branch that marks strings is an operator, which the
      // policy judges by a urlKind mark (it must be literal), or an object
      // whose properties other branches mark (an option that is a string or a
      // { label, value } object), so it is walked too.
      if (type.isString(kind)) {
        kinds.set(item.path, kind);
      }
      Object.keys(item.value).forEach((key) => {
        childSchemas({ schemas, key }).forEach((childSchema) =>
          pending.push({ value: item.value[key], schema: childSchema, path: `${item.path}.${key}` })
        );
      });
    }
  }
  return kinds;
}

export default collectSchemaKinds;
