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

// A saved view id as a stable string, for tabs, lookups and the persisted active view. Ids from a
// MongoDB request arrive as `{ _oid: hex }` (the client's ObjectId form): the hex is the key, so
// the id and its hex string find the same view. Other objects key by their JSON; String() would
// make every object "[object Object]".
function getViewKey(id) {
  if (type.isObject(id)) {
    if (type.isString(id._oid)) return id._oid;
    return JSON.stringify(id);
  }
  return String(id);
}

export default getViewKey;
