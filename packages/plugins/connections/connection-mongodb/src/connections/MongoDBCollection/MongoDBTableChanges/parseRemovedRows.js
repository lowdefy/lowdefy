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

// `removed` is [rowKey] of existing rows to delete.
function parseRemovedRows({ removed, rowKeyType }) {
  const seen = new Set();
  return removed.map((value) => {
    const key = coerceRowKey({ value, rowKeyType, part: 'removed' });
    const keyId = getKeyId(key);
    if (seen.has(keyId)) {
      throw new Error(`MongoDBTableChanges removed row ${JSON.stringify(value)} appears twice.`);
    }
    seen.add(keyId);
    return key;
  });
}

export default parseRemovedRows;
