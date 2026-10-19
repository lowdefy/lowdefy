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

import coercePosition from './coercePosition.js';
import coerceRowKey from './coerceRowKey.js';
import getRowPatch from './getRowPatch.js';

// `moved` is { [rowKey]: position }: one position field written on each moved row, merged
// into that row's `updated` fields. A move wins over an edited position.
function parseMovedRows({ moved, positionField, rowKeyType, rows }) {
  const entries = Object.entries(moved);
  if (entries.length === 0) return;
  if (type.isNone(positionField)) {
    throw new Error(
      'MongoDBTableChanges changes have "moved" positions, but the request has no "positionField" to write them to.'
    );
  }
  entries.forEach(([rawKey, position]) => {
    const key = coerceRowKey({ value: rawKey, rowKeyType, part: 'moved' });
    const location = `moved row ${JSON.stringify(rawKey)}`;
    getRowPatch({ rows, key }).set(positionField, coercePosition({ value: position, location }));
  });
}

export default parseMovedRows;
