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

import { serializer, type } from '@lowdefy/helpers';

// A string key per record, used as the list key and to track expanded rows. Ids that are not
// strings (such as MongoDB ObjectIds, which reach the client as `{ _oid }`) are stably serialized
// so equal ids give equal keys. Records without an id, and records repeating an id already used,
// fall back to their index so every key stays unique.
function getEntryKey({ id, index, usedKeys }) {
  let key = `~index:${index}`;
  if (type.isString(id)) {
    key = id;
  } else if (!type.isNone(id)) {
    key = serializer.serializeToString(id, { stable: true });
  }
  if (usedKeys.has(key)) {
    key = `${key}~index:${index}`;
  }
  usedKeys.add(key);
  return key;
}

export default getEntryKey;
