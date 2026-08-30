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

// Resolves a dotted update key (`address.city`, `evidence_ids.0`,
// `tags.$[elem]`) to the declared schema it addresses, walking `properties`
// for object segments and `items` for array positions ($, $[], $[id] or an
// index). Returns null when any segment leaves declared territory - an
// undeclared path is not validated.
const ARRAY_POSITION = /^(\d+|\$|\$\[.*\])$/;

function resolveUpdateFieldSchema({ fields, path }) {
  const [fieldName, ...segments] = path.split('.');
  let schema = fields[fieldName];
  for (const segment of segments) {
    if (!type.isObject(schema)) {
      return null;
    }
    if (ARRAY_POSITION.test(segment)) {
      schema = schema.items;
      continue;
    }
    schema = schema.properties?.[segment];
  }
  return type.isObject(schema) ? schema : null;
}

export default resolveUpdateFieldSchema;
