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

import { lookup } from 'node:dns';

import isPublicAddress from './isPublicAddress.js';

// A dns.lookup for the socket to use: the socket connects to the addresses this answers, so the
// address checked is the address connected to, and a name that resolves differently on a second
// lookup cannot get past the check. Refuses a name when any of its addresses is not public, with
// the error createNotPublicError(hostname) returns.
function createLookupPublicAddress({ createNotPublicError }) {
  return function lookupPublicAddress(hostname, options, callback) {
    lookup(hostname, options, (error, address, family) => {
      if (error) {
        callback(error);
        return;
      }
      const addresses = Array.isArray(address) ? address.map((entry) => entry.address) : [address];
      if (!addresses.every(isPublicAddress)) {
        callback(createNotPublicError(hostname));
        return;
      }
      callback(null, address, family);
    });
  };
}

export default createLookupPublicAddress;
