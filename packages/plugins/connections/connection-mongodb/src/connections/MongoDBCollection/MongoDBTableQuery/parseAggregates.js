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

import getViewField from './getViewField.js';

function parseAggregates({ aggregates, fieldsByKey }) {
  if (type.isNone(aggregates)) {
    return {};
  }
  if (!type.isObject(aggregates)) {
    throw new Error(
      `MongoDBTableQuery view aggregates must be an object of { [key]: function }. Received ${JSON.stringify(
        aggregates
      )}.`
    );
  }
  const parsed = {};
  Object.entries(aggregates).forEach(([key, fn]) => {
    const field = getViewField({ fieldsByKey, key, part: 'aggregates' });
    if (!type.isString(fn) || !field.aggregates.includes(fn)) {
      throw new Error(
        `MongoDBTableQuery aggregate ${JSON.stringify(fn)} is not allowed on "${
          field.key
        }" of type "${field.type}". Allowed aggregates: ${field.aggregates.join(', ')}.`
      );
    }
    // A distinct count groups by the field's values, so it costs what grouping by the field
    // costs, and the app allows it the same way.
    if (fn === 'countDistinct' && !field.groupable) {
      throw new Error(
        `MongoDBTableQuery aggregate "countDistinct" on "${field.key}" groups by its values, so the field needs "groupable: true".`
      );
    }
    parsed[field.key] = fn;
  });
  return parsed;
}

export default parseAggregates;
