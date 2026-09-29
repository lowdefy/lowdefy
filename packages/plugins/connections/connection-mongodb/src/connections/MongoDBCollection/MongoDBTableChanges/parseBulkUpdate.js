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

import assertPatchPaths from './assertPatchPaths.js';
import coerceFieldValue from './coerceFieldValue.js';
import getChangeField from './getChangeField.js';

// The update of a bulk save: `set` is { [field]: value } and `unset` [field], the fields being
// `fields` keys, checked and coerced like `updated` values.
function parseBulkUpdate({ set, unset, fieldsByKey, keyField }) {
  if (!(type.isNone(set) || type.isObject(set)) || !(type.isNone(unset) || type.isArray(unset))) {
    throw new Error(
      `MongoDBTableChanges "set" should be an object of field values and "unset" an array of fields. Received ${JSON.stringify(
        { set, unset }
      )}.`
    );
  }
  const setEntries = Object.entries(set ?? {});
  const unsetKeys = unset ?? [];
  if (setEntries.length + unsetKeys.length === 0) {
    throw new Error(
      'MongoDBTableChanges with a "selection" needs "set" or "unset", the fields to write on every selected row.'
    );
  }
  const $set = new Map();
  setEntries.forEach(([key, value]) => {
    const field = getChangeField({ fieldsByKey, key, location: 'set' });
    $set.set(field.path, coerceFieldValue({ field, value, location: 'set' }));
  });
  const $unset = new Map();
  unsetKeys.forEach((key) => {
    const field = getChangeField({ fieldsByKey, key, location: 'unset' });
    if ($set.has(field.path)) {
      throw new Error(
        `MongoDBTableChanges set and unset: "${key}" and "${key}" overlap, so they can not both be written.`
      );
    }
    $unset.set(field.path, '');
  });
  assertPatchPaths({
    patch: new Map([...$set, ...$unset]),
    keyField,
    location: 'set and unset',
  });
  const update = {};
  if ($set.size > 0) update.$set = Object.fromEntries($set);
  if ($unset.size > 0) update.$unset = Object.fromEntries($unset);
  return update;
}

export default parseBulkUpdate;
