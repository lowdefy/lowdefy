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

import { splitPath } from '@lowdefy/helpers';

// Keys are '<namespace>:<path>' ('state:a.b', 'request:id') or a bare namespace ('i18n', 'menu').
// Paths are compared as unescaped dot strings. `get` falls back to literal dotted keys, so a read of
// 'a.b.c' can resolve state['a.b'].c, which a write addresses as 'a\.b.c'. Both normalise to
// 'a.b.c' and match. Unescaping can only make more keys match, which is the safe direction.
// Every recorded read is normalised, so a key with no escape returns before anything is sliced.
function normalizeTrackingKey(key) {
  if (!key.includes('\\')) {
    return key;
  }
  const separator = key.indexOf(':');
  if (separator === -1) {
    return key;
  }
  const path = key.slice(separator + 1);
  return `${key.slice(0, separator)}:${splitPath(path).join('.')}`;
}

export default normalizeTrackingKey;
