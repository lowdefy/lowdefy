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

import { BlockList, isIPv6 } from 'node:net';

// Ranges a url copy may not reach: anything that is not a public unicast address. BlockList also
// matches an IPv4-mapped IPv6 address (::ffff:127.0.0.1) against the IPv4 ranges.
const notPublicIPv4 = [
  ['0.0.0.0', 8], // this network, unspecified
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, cloud metadata
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved, broadcast
];

// The 6to4 address (2002::/16) that carries an IPv4 network in its next 32 bits.
function sixToFourNetwork(network) {
  const [a, b, c, d] = network.split('.').map(Number);
  return `2002:${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}::`;
}

const notPublic = new BlockList();
notPublicIPv4.forEach(([network, prefix]) => {
  notPublic.addSubnet(network, prefix, 'ipv4');
  // An IPv6 address that embeds one of these IPv4 addresses: a NAT64 gateway (64:ff9b::/96)
  // or a 6to4 relay forwards it to that IPv4 address.
  notPublic.addSubnet(`64:ff9b::${network}`, 96 + prefix, 'ipv6');
  notPublic.addSubnet(sixToFourNetwork(network), 16 + prefix, 'ipv6');
});
[
  ['::', 96], // unspecified, loopback, IPv4-compatible
  ['64:ff9b:1::', 48], // local-use IPv4/IPv6 translation
  ['fc00::', 7], // unique local
  ['fe80::', 10], // link-local
  ['fec0::', 10], // site-local
  ['ff00::', 8], // multicast
].forEach(([network, prefix]) => notPublic.addSubnet(network, prefix, 'ipv6'));

function isPublicAddress(address) {
  return !notPublic.check(address, isIPv6(address) ? 'ipv6' : 'ipv4');
}

export default isPublicAddress;
