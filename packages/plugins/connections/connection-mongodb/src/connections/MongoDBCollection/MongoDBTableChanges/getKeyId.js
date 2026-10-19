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

import { ObjectId } from 'mongodb';

// One string per coerced row key, so the same row named in `updated`, `moved`, `removed` and
// `order` is recognised as one row. The type is part of it: the string "5" and the number 5
// address different documents.
function getKeyId(key) {
  if (key instanceof ObjectId) return `objectId:${key.toHexString()}`;
  return `${typeof key}:${key}`;
}

export default getKeyId;
