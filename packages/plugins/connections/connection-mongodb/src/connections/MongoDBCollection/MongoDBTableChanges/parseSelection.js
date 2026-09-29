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

import coerceRowKey from './coerceRowKey.js';
import getKeyId from './getKeyId.js';

const selectAllKeys = ['all', 'except', 'filter', 'search'];

function invalidSelection(selection) {
  return new Error(
    `MongoDBTableChanges "selection" should be an array of row keys or { all: true, except, filter, search }. Received ${JSON.stringify(
      selection
    )}.`
  );
}

function parseKeys({ keys, rowKeyType, maxChanges }) {
  if (keys.length > maxChanges) {
    throw new Error(
      `MongoDBTableChanges "selection" has ${keys.length} row keys, more than "maxChanges" (${maxChanges}).`
    );
  }
  const seen = new Set();
  return keys
    .map((value) => coerceRowKey({ value, rowKeyType, part: 'selection' }))
    .filter((key) => {
      const keyId = getKeyId(key);
      if (seen.has(keyId)) return false;
      seen.add(keyId);
      return true;
    });
}

// The Table's `selected` value: the selected row keys, or, when every row matching the view is
// selected, { all: true, except, filter, search } (the keys deselected since, and the view's
// filter and search). Keys are read like changeset keys; the view is compiled by the caller.
function parseSelection({ selection, rowKeyType, maxChanges }) {
  if (type.isArray(selection)) {
    if (selection.length === 0) {
      throw new Error('MongoDBTableChanges "selection" is empty: there is nothing to write.');
    }
    return { keys: parseKeys({ keys: selection, rowKeyType, maxChanges }) };
  }
  if (
    !type.isObject(selection) ||
    selection.all !== true ||
    Object.keys(selection).some((key) => !selectAllKeys.includes(key)) ||
    !(type.isNone(selection.except) || type.isArray(selection.except))
  ) {
    throw invalidSelection(selection);
  }
  return {
    all: true,
    except: parseKeys({ keys: selection.except ?? [], rowKeyType, maxChanges }),
    filter: selection.filter ?? null,
    search: selection.search ?? null,
  };
}

export default parseSelection;
