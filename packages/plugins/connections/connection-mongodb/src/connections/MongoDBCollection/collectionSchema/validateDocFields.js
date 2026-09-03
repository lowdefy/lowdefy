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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import validateFieldValue from './validateFieldValue.js';

// Validates a whole document (an insert, or a bulkWrite replacement) against
// the collection's declared fields. Only declared keys are checked -
// undeclared keys pass, because a declaration describes the fields it knows
// about and rejecting the rest would break every write that adds a field
// before the declaration catches up. A field named in the collection's
// `required` array must be present and non-null in the document.
//
// Runs after the tenant stamp so a contract that declares the tenant field
// required sees the value the framework wrote.
function validateDocFields({ doc, collectionSchema, position = 'an insert document' }) {
  const { fields, name, required } = collectionSchema;
  if (!type.isObject(doc)) {
    return;
  }
  (required ?? []).forEach((fieldName) => {
    const value = doc[fieldName];
    if (fieldName in doc && value !== null && !type.isUndefined(value)) return;
    throw new ConfigError(
      `Field "${fieldName}" in ${position} for collection "${name}" is required by the declared contract but is ${
        fieldName in doc ? 'null' : 'missing'
      }.`
    );
  });
  Object.keys(fields).forEach((fieldName) => {
    const value = doc[fieldName];
    if (!(fieldName in doc) || value === null || type.isUndefined(value)) return;
    validateFieldValue({
      collectionName: name,
      fieldName,
      fieldSchema: fields[fieldName],
      position,
      value,
    });
  });
}

export default validateDocFields;
