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

import { compile } from '@lowdefy/ajv';
import { type } from '@lowdefy/helpers';

// One compiled validator per declared field, keyed by the field's schema
// object. context.readConfigFile caches build/collections.json, so the same
// schema objects arrive on every request of a server process and each field
// compiles once; a rebuild in dev hands out new objects and recompiles.
const validators = new WeakMap();

// The build's `required` is a presence flag on the field, not JSON Schema's
// array-valued keyword - ajv would refuse to compile it. Presence is checked
// by validateDocFields; the value validator sees the schema without it.
function stripRequired(schema) {
  const copy = {};
  Object.keys(schema).forEach((key) => {
    if (key === 'required') return;
    if (key === 'items' && type.isObject(schema.items)) {
      copy.items = stripRequired(schema.items);
      return;
    }
    if (key === 'properties' && type.isObject(schema.properties)) {
      copy.properties = {};
      Object.keys(schema.properties).forEach((name) => {
        copy.properties[name] = stripRequired(schema.properties[name]);
      });
      return;
    }
    copy[key] = schema[key];
  });
  return copy;
}

function getFieldValidator({ fieldSchema }) {
  let validator = validators.get(fieldSchema);
  if (!validator) {
    validator = compile({ schema: stripRequired(fieldSchema) });
    validators.set(fieldSchema, validator);
  }
  return validator;
}

export default getFieldValidator;
