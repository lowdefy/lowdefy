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

// The 16 bytes of an IPv6 address, or null when it does not parse. An address is
// judged as bytes, never as text: URL rewrites a host into its own canonical
// spelling (the mapped loopback ::ffff:127.0.0.1 arrives as ::ffff:7f00:1), so a
// text pattern is not looking at the spelling it gets. Bytes have one spelling.
function ipv6Bytes(ip) {
  let text = ip.toLowerCase();
  // A zone index (fe80::1%eth0) names a local interface, not part of the address.
  const zone = text.indexOf('%');
  if (zone !== -1) text = text.slice(0, zone);

  // A trailing dotted-quad (::ffff:127.0.0.1) is two hextets written the other way.
  const dotted = text.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dotted) {
    const octets = dotted[1].split('.').map(Number);
    if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return null;
    text =
      text.slice(0, -dotted[1].length) +
      [
        ((octets[0] << 8) | octets[1]).toString(16),
        ((octets[2] << 8) | octets[3]).toString(16),
      ].join(':');
  }

  const [head, tail, ...extra] = text.split('::');
  if (extra.length > 0) return null;
  const hextetsOf = (part) => (part === '' ? [] : part.split(':'));
  const left = hextetsOf(head);
  const right = tail === undefined ? [] : hextetsOf(tail);
  const filled = 8 - left.length - right.length;
  // Without a '::' run every hextet must be written out; with one, at least one
  // must be elided.
  if (tail === undefined && filled !== 0) return null;
  if (tail !== undefined && filled < 0) return null;
  const hextets = [...left, ...Array(filled).fill('0'), ...right];

  const bytes = new Uint8Array(16);
  for (let index = 0; index < 8; index += 1) {
    if (!/^[0-9a-f]{1,4}$/.test(hextets[index])) return null;
    const value = Number.parseInt(hextets[index], 16);
    bytes[index * 2] = value >> 8;
    bytes[index * 2 + 1] = value & 0xff;
  }
  return bytes;
}

export default ipv6Bytes;
