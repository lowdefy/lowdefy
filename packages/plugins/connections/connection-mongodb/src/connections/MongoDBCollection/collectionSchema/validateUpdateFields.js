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

import resolveUpdateFieldSchema from './resolveUpdateFieldSchema.js';
import validateFieldValue from './validateFieldValue.js';

// Only $set and $setOnInsert carry the shape a field will hold after the
// write, so only their values are validated. $inc, $push, $unset, $mul, $min,
// $rename and the rest express deltas over the stored value rather than
// shapes, and an aggregation-pipeline update is opaque here; both pass.
const VALIDATED_OPERATORS = ['$set', '$setOnInsert'];

function validateUpdateFields({ update, collectionSchema, position = 'an update' }) {
  if (!type.isObject(update)) {
    return;
  }
  const { fields, name } = collectionSchema;
  VALIDATED_OPERATORS.forEach((operator) => {
    const values = update[operator];
    if (!type.isObject(values)) {
      return;
    }
    Object.keys(values).forEach((path) => {
      const fieldSchema = resolveUpdateFieldSchema({ fields, path });
      if (fieldSchema === null) {
        return;
      }
      validateFieldValue({
        collectionName: name,
        fieldName: path,
        fieldSchema,
        position: `${operator} of ${position}`,
        value: values[path],
      });
    });
  });
}

export default validateUpdateFields;
