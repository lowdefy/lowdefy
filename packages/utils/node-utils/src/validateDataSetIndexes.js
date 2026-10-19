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

// The shape listIndexes() returns, so a recorded index and a declared one are interchangeable.
// Every other option (unique, weights, partialFilterExpression, ...) passes to createIndexes as
// given; `v` and `ns` describe an existing index, not one to create.
function validateDataSetIndexes({ indexes, fail }) {
  if (type.isNone(indexes)) return {};
  if (!type.isObject(indexes)) {
    fail('"indexes" should be an object keyed by connection id.');
  }
  Object.entries(indexes).forEach(([connectionId, entries]) => {
    if (connectionId.startsWith('_')) {
      fail(`indexes key "${connectionId}" looks like an operator; data sets are plain YAML.`);
    }
    if (!type.isArray(entries)) {
      fail(`indexes.${connectionId} should be an array of indexes.`);
    }
    entries.forEach((entry, index) => {
      const where = `indexes.${connectionId}[${index}]`;
      if (!type.isObject(entry)) {
        fail(`${where} should be an object with a "key".`);
      }
      if (!type.isObject(entry.key) || Object.keys(entry.key).length === 0) {
        fail(`${where} should have a "key" object, e.g. { key: { organizationId: 1 } }.`);
      }
      if (!type.isUndefined(entry.name) && !type.isString(entry.name)) {
        fail(`${where} "name" should be a string.`);
      }
      ['v', 'ns'].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(entry, key)) {
          fail(`${where} has "${key}", which describes an existing index; remove it.`);
        }
      });
    });
  });
  return indexes;
}

export default validateDataSetIndexes;
