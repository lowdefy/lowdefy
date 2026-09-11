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

import net from 'node:net';

/**
 * A net.connect lookup that answers with the addresses already checked instead
 * of asking DNS again. Node calls it with `all: true` when it selects between
 * address families itself and expects an array; otherwise it expects the single
 * address and its family.
 */
function createPinnedLookup(addresses) {
  const records = addresses.map((address) => ({ address, family: net.isIP(address) }));
  return function pinnedLookup(hostname, options, callback) {
    if (options?.all === true) {
      callback(null, records);
      return;
    }
    callback(null, records[0].address, records[0].family);
  };
}

export default createPinnedLookup;
