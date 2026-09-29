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

import { get, serializer, set } from '@lowdefy/helpers';

import valuesEqual from './valuesEqual.js';

function setAddedField({ changes, key, field, value }) {
  let found = false;
  const added = changes.added.map((entry) => {
    if (String(entry.rowKey) !== key) return entry;
    found = true;
    const next = serializer.copy(entry);
    set(next, field, serializer.copy(value));
    return next;
  });
  return found ? { ...changes, added } : changes;
}

// One cell edit as a new changeset. For a row added in the table, the field is set in its
// `added` entry. For a data row, `updated[rowKey][field]` holds the new value under the column's
// dot path (`'address.city'`, a MongoDB $set key); a value equal to the data row's original
// removes the field again, and the row's entry when it is empty, so an edit that is undone by
// hand leaves no change behind. `dataRow` is the unchanged row from `data`, or undefined for an
// added row.
function setChangeField({ changes, rowKey, field, value, dataRow }) {
  const key = String(rowKey);
  if (dataRow === undefined) return setAddedField({ changes, key, field, value });
  const current = changes.updated[key] ?? {};
  let patch;
  if (valuesEqual(value, get(dataRow, field))) {
    if (!Object.hasOwn(current, field)) return changes;
    patch = { ...current };
    delete patch[field];
  } else {
    patch = { ...current, [field]: serializer.copy(value) };
  }
  const updated = { ...changes.updated };
  if (Object.keys(patch).length > 0) {
    updated[key] = patch;
  } else {
    delete updated[key];
  }
  return { ...changes, updated };
}

export default setChangeField;
