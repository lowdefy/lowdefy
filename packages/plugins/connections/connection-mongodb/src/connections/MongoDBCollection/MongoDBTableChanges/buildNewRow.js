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
import { get, type } from '@lowdefy/helpers';

import buildInsertDocument from './buildInsertDocument.js';

// A new row or item with its key. When the key field is `_id` and the row has no real key, a
// new ObjectId is generated here rather than by the driver or the server, so the response can
// map the browser's temporary key to it (and an embedded array item gets an `_id` at all).
function buildNewRow({ entry, insertDefaults, keyField, generateId, scopeValues }) {
  const document = buildInsertDocument({ patch: entry.patch, insertDefaults, scopeValues });
  const key = get(document, keyField);
  if (!type.isNone(key) && key !== '') return { document, key };
  if (keyField !== '_id') {
    throw new Error(
      `MongoDBTableChanges added row ${JSON.stringify(
        entry.rowKey
      )} has no "${keyField}" value. With a key field other than "_id", new rows need their key from a column (in "fields") or "insertDefaults".`
    );
  }
  const generated = generateId();
  document._id = generated;
  return { document, key: generated };
}

export default buildNewRow;
