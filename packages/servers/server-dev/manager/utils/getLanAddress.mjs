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

import os from 'node:os';

// Ported from the earlier mobile work's `lowdefy mobile dev`, which took the
// first non-internal IPv4 address. That can be a VPN or Docker address, so
// this one prefers a private (RFC 1918) address, names the interface it chose,
// and takes an interface by name.

function isIpv4(address) {
  // Node 18.0 to 18.3 report the family as a number.
  return address.family === 'IPv4' || address.family === 4;
}

function isPrivateIpv4(address) {
  const [first, second] = address.split('.').map(Number);
  if (first === 10) {
    return true;
  }
  if (first === 172 && second >= 16 && second <= 31) {
    return true;
  }
  return first === 192 && second === 168;
}

function listExternalIpv4({ interfaces }) {
  const found = [];
  Object.entries(interfaces).forEach(([name, addresses]) => {
    (addresses ?? []).forEach((address) => {
      if (isIpv4(address) && !address.internal) {
        found.push({ name, address: address.address });
      }
    });
  });
  return found;
}

function describe(found) {
  if (found.length === 0) {
    return 'This computer has no network interface with an IPv4 address.';
  }
  return `Interfaces with an IPv4 address: ${found
    .map(({ name, address }) => `${name} (${address})`)
    .join(', ')}.`;
}

function getLanAddress({ interfaceName, interfaces = os.networkInterfaces() }) {
  const found = listExternalIpv4({ interfaces });
  if (interfaceName !== undefined) {
    const named = found.find(({ name }) => name === interfaceName);
    if (named === undefined) {
      throw new Error(
        `Network interface "${interfaceName}" has no IPv4 address. ${describe(found)}`
      );
    }
    return named;
  }
  const lan = found.find(({ address }) => isPrivateIpv4(address));
  if (lan === undefined) {
    throw new Error(
      `No private network address found for --lan. ${describe(
        found
      )} Pass one with --lan <interface>.`
    );
  }
  return lan;
}

export default getLanAddress;
