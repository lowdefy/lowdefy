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

// Group entries as column keys: the view's `[{ key }]`, or plain keys (setGroup accepts both).
function toGroupKeys(group) {
  if (type.isNone(group)) return [];
  if (!type.isArray(group)) {
    throw new Error(`Table group must be an array of { key }. Received ${JSON.stringify(group)}.`);
  }
  return group.map((entry) => (type.isObject(entry) ? entry.key : entry));
}

export default toGroupKeys;
