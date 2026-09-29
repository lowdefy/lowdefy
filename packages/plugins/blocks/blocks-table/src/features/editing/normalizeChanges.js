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

import createEmptyChanges from './createEmptyChanges.js';

function isComplete(value) {
  return type.isObject(value.updated) && type.isArray(value.added) && type.isArray(value.removed);
}

// TableInput's value as a complete changeset:
//   { updated: { [rowKey]: { [field]: value } }, added: [{ rowKey, ...row }], removed: [rowKey],
//     moved?: { [rowKey]: position }, order?: [rowKey] }
// A complete value is returned as it is, so the value the table wrote keeps its identity (undo
// compares by identity). A partial value set from outside is filled in; anything else is empty.
function normalizeChanges(value) {
  if (!type.isObject(value)) return createEmptyChanges();
  if (isComplete(value)) return value;
  const changes = {
    updated: type.isObject(value.updated) ? value.updated : {},
    added: type.isArray(value.added) ? value.added : [],
    removed: type.isArray(value.removed) ? value.removed : [],
  };
  if (type.isObject(value.moved)) changes.moved = value.moved;
  if (type.isArray(value.order)) changes.order = value.order;
  return changes;
}

export default normalizeChanges;
