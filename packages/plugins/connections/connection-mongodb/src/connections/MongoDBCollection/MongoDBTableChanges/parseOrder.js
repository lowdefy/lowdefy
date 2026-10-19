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
import coerceRowKey from './coerceRowKey.js';
import getKeyId from './getKeyId.js';

// `order` is every row key in the new order, added rows by their temporary key. An added
// row's entry points at it; any other key is an existing row.
function parseOrder({ order, added, rowKeyType }) {
  const addedIndexByKey = new Map(added.map((entry, index) => [String(entry.rowKey), index]));
  const seen = new Set();
  return order.map((value) => {
    const addedIndex = addedIndexByKey.get(String(value));
    const item =
      addedIndex === undefined
        ? { key: coerceRowKey({ value, rowKeyType, part: 'order' }) }
        : { addedIndex };
    const id = addedIndex === undefined ? getKeyId(item.key) : `added:${addedIndex}`;
    if (seen.has(id)) {
      throw new Error(`MongoDBTableChanges order row ${JSON.stringify(value)} appears twice.`);
    }
    seen.add(id);
    return item;
  });
}

export default parseOrder;
