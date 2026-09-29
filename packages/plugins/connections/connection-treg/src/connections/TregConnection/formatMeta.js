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

// X-Treg-Meta: "key=value, key=value". Keys and values are checked by the schema; treg
// refuses a malformed bag with a 422 before it relays anything, so it costs nothing.
function formatMeta(meta) {
  const pairs = Object.entries(meta ?? {}).filter(([, value]) => !type.isNone(value));
  if (pairs.length === 0) return null;
  return pairs.map(([key, value]) => `${key}=${value}`).join(', ');
}

export default formatMeta;
