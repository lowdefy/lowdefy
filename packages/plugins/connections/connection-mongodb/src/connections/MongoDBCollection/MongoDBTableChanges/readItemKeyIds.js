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

import getKeyId from './getKeyId.js';

// The key ids of the items of the array mode document, when `filter` (the scoped document
// filter) matches it, read with a projection of the item key field only.
async function readItemKeyIds({ collection, filter, path, itemKeyField }) {
  const document = await collection.findOne(filter, {
    projection: { [`${path}.${itemKeyField}`]: 1 },
  });
  const items = get(document ?? {}, path);
  const keyIds = new Set();
  (type.isArray(items) ? items : []).forEach((item) => {
    const key = get(item, itemKeyField);
    if (!type.isNone(key)) keyIds.add(getKeyId(key));
  });
  return keyIds;
}

export default readItemKeyIds;
