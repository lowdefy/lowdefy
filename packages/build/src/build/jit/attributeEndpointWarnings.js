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

import createFindEndpointOfKey from './createFindEndpointOfKey.js';

// Sorts a config build's build status warnings by the endpoint each was found
// in, so an endpoint rebuilt alone replaces only its own (buildEndpointsJit).
// A warning with no config key, or one outside every endpoint, stays with the
// rest of the config's.
function attributeEndpointWarnings({ endpointRegistry, keyMap, warnings }) {
  const findEndpointOfKey = createFindEndpointOfKey({ endpointRegistry, keyMap });
  const byEndpoint = new Map();
  const other = [];
  for (const warning of warnings) {
    const endpointId = findEndpointOfKey(warning.configKey);
    if (endpointId === null) {
      other.push(warning);
      continue;
    }
    if (!byEndpoint.has(endpointId)) {
      byEndpoint.set(endpointId, []);
    }
    byEndpoint.get(endpointId).push(warning);
  }
  endpointRegistry.warnings = { byEndpoint, other };
}

export default attributeEndpointWarnings;
