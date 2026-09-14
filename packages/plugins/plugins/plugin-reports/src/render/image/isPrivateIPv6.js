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

import ipv6Bytes from './ipv6Bytes.js';
import isPrivateIPv4 from './isPrivateIPv4.js';

function isZero(bytes, from, to) {
  return bytes.subarray(from, to).every((byte) => byte === 0);
}

function isPrivateIPv6(ip) {
  const bytes = ipv6Bytes(ip);
  if (bytes === null) return true; // unparseable: refuse rather than risk it

  // Three ranges carry an IPv4 address in their low four bytes: IPv4-mapped
  // (::ffff:0:0/96), the deprecated IPv4-compatible (::/96, which is also how
  // loopback ::1 and the unspecified :: land here), and NAT64 (64:ff9b::/96).
  // Each is a route to that address, so judge it as the address it carries.
  const embedsIPv4 =
    (isZero(bytes, 0, 10) && bytes[10] === 0xff && bytes[11] === 0xff) ||
    isZero(bytes, 0, 12) ||
    (bytes[0] === 0x00 &&
      bytes[1] === 0x64 &&
      bytes[2] === 0xff &&
      bytes[3] === 0x9b &&
      isZero(bytes, 4, 12));
  if (embedsIPv4) return isPrivateIPv4(bytes.slice(12).join('.'));

  if ((bytes[0] & 0xfe) === 0xfc) return true; // fc00::/7 unique-local
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80) return true; // fe80::/10 link-local
  if (bytes[0] === 0xff) return true; // ff00::/8 multicast
  return false;
}

export default isPrivateIPv6;
