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

const PREFIX_PATTERN = /^\d{1,3}$/;

// Parses an IP address ("10.0.0.7", "2001:db8::1") or a CIDR range
// ("10.0.0.0/8", "2001:db8::/32") into the arguments net.BlockList.addSubnet
// takes. A bare address is a range of one. Returns null for anything else, so
// a malformed entry is refused rather than silently matching nothing.
function parseIpRange(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const [address, prefixPart, ...rest] = value.trim().split('/');
  const version = net.isIP(address);
  if (version === 0 || rest.length > 0) {
    return null;
  }
  const family = version === 6 ? 'ipv6' : 'ipv4';
  const maxPrefix = version === 6 ? 128 : 32;
  if (prefixPart === undefined) {
    return { address, prefix: maxPrefix, family };
  }
  if (!PREFIX_PATTERN.test(prefixPart)) {
    return null;
  }
  const prefix = Number(prefixPart);
  if (prefix > maxPrefix) {
    return null;
  }
  return { address, prefix, family };
}

export default parseIpRange;
