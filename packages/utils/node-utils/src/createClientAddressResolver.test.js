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

import createClientAddressResolver from './createClientAddressResolver.js';

const resolveUntrusted = createClientAddressResolver({ trustedProxies: [] });
const resolveBehindProxies = createClientAddressResolver({
  trustedProxies: ['10.0.0.0/8', '127.0.0.1', 'fd00::/8'],
});

test.each([
  ['the peer with no forwarding header', { peerAddress: '198.51.100.4' }, '198.51.100.4'],
  [
    'the peer, ignoring a forwarding header it sent',
    { peerAddress: '198.51.100.4', forwardedFor: '203.0.113.9' },
    '198.51.100.4',
  ],
  [
    'a loopback peer, ignoring the header when loopback is not trusted',
    { peerAddress: '127.0.0.1', forwardedFor: '203.0.113.9' },
    '127.0.0.1',
  ],
  [
    'an IPv4-mapped peer as its IPv4 address',
    { peerAddress: '::ffff:198.51.100.4' },
    '198.51.100.4',
  ],
  ['null when the peer is unknown', { peerAddress: undefined }, null],
  ['null when the peer is not an address', { peerAddress: 'unix-socket' }, null],
])('with no trusted proxies, resolves %s', (_, input, expected) => {
  expect(resolveUntrusted(input)).toBe(expected);
});

test.each([
  [
    'the address a trusted proxy forwarded',
    { peerAddress: '10.1.2.3', forwardedFor: '203.0.113.9' },
    '203.0.113.9',
  ],
  [
    'the rightmost untrusted hop, not a client-written entry to its left',
    { peerAddress: '10.1.2.3', forwardedFor: '198.51.100.66, 203.0.113.9' },
    '203.0.113.9',
  ],
  [
    'past a chain of trusted proxies',
    { peerAddress: '127.0.0.1', forwardedFor: '203.0.113.9, 10.9.9.9, 10.1.1.1' },
    '203.0.113.9',
  ],
  [
    'the peer when it is not a trusted proxy',
    { peerAddress: '198.51.100.4', forwardedFor: '203.0.113.9' },
    '198.51.100.4',
  ],
  ['the trusted peer when no header was forwarded', { peerAddress: '10.1.2.3' }, '10.1.2.3'],
  [
    'an IPv4-mapped peer inside a trusted IPv4 range',
    { peerAddress: '::ffff:10.1.2.3', forwardedFor: '203.0.113.9' },
    '203.0.113.9',
  ],
  [
    'an IPv6 client behind an IPv6 proxy',
    { peerAddress: 'fd12::1', forwardedFor: '2001:db8::7' },
    '2001:db8::7',
  ],
  [
    'an IPv4-mapped hop as its IPv4 address',
    { peerAddress: '10.1.2.3', forwardedFor: '::ffff:203.0.113.9' },
    '203.0.113.9',
  ],
  [
    'a bracketed IPv4-mapped hop as its IPv4 address',
    { peerAddress: '10.1.2.3', forwardedFor: '[::ffff:203.0.113.9]:443' },
    '203.0.113.9',
  ],
  [
    'past an IPv4-mapped hop inside a trusted IPv4 range',
    { peerAddress: '10.1.2.3', forwardedFor: '203.0.113.9, ::ffff:10.4.4.4' },
    '203.0.113.9',
  ],
  [
    'a hop written with its port',
    { peerAddress: '10.1.2.3', forwardedFor: '203.0.113.9:51234' },
    '203.0.113.9',
  ],
  [
    'a bracketed IPv6 hop written with its port',
    { peerAddress: '10.1.2.3', forwardedFor: '[2001:db8::7]:443' },
    '2001:db8::7',
  ],
  [
    'the last trusted hop when the next one is malformed',
    { peerAddress: '10.1.2.3', forwardedFor: 'unknown, 10.4.4.4' },
    '10.4.4.4',
  ],
  [
    'the leftmost hop when every hop is trusted',
    { peerAddress: '10.1.2.3', forwardedFor: '10.7.7.7, 10.4.4.4' },
    '10.7.7.7',
  ],
  [
    'the trusted peer when the header is empty',
    { peerAddress: '10.1.2.3', forwardedFor: ' , ' },
    '10.1.2.3',
  ],
])('with trusted proxies, resolves %s', (_, input, expected) => {
  expect(resolveBehindProxies(input)).toBe(expected);
});
