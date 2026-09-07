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

import dns from 'node:dns/promises';
import net from 'node:net';

import isPrivateAddress from './isPrivateAddress.js';

/**
 * Resolve a URL host to the addresses the fetch may connect to, or null when
 * any of them is refused. A literal IP is judged directly. A hostname is looked
 * up once, here, and the caller pins the connection to exactly these addresses,
 * so a record that changes between the check and the connect (DNS rebinding)
 * cannot route the request to an address this module never saw.
 */
async function resolveHostAddresses(hostname) {
  // URL.hostname keeps the brackets around an IPv6 literal.
  const host = hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(host) !== 0) {
    return isPrivateAddress(host) ? null : [host];
  }
  let records;
  try {
    records = await dns.lookup(host, { all: true });
  } catch {
    return null;
  }
  if (records.length === 0) return null;
  if (records.some((record) => isPrivateAddress(record.address))) return null;
  return records.map((record) => record.address);
}

export default resolveHostAddresses;
