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

// Finds the endpoint a config key is in: the key's parent chain in the key map
// reaches the endpoint's root key. Null for a key outside every endpoint.
function createFindEndpointOfKey({ endpointRegistry, keyMap }) {
  const roots = new Map();
  for (const entry of endpointRegistry.endpoints.values()) {
    roots.set(entry.rootKey, entry.endpointId);
  }
  return function findEndpointOfKey(configKey) {
    const seen = new Set();
    let current = configKey;
    while (!type.isNone(current) && !seen.has(current)) {
      if (roots.has(current)) {
        return roots.get(current);
      }
      seen.add(current);
      current = keyMap[current]?.p;
    }
    return null;
  };
}

export default createFindEndpointOfKey;
