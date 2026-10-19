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

import parseIpRange from './parseIpRange.js';

test.each([
  ['10.0.0.7', { address: '10.0.0.7', prefix: 32, family: 'ipv4' }],
  ['10.0.0.0/8', { address: '10.0.0.0', prefix: 8, family: 'ipv4' }],
  ['0.0.0.0/0', { address: '0.0.0.0', prefix: 0, family: 'ipv4' }],
  ['2001:db8::1', { address: '2001:db8::1', prefix: 128, family: 'ipv6' }],
  ['2001:db8::/32', { address: '2001:db8::', prefix: 32, family: 'ipv6' }],
  [' 192.168.1.0/24 ', { address: '192.168.1.0', prefix: 24, family: 'ipv4' }],
])('parseIpRange parses %j', (value, expected) => {
  expect(parseIpRange(value)).toEqual(expected);
});

test.each([
  ['a hostname', 'proxy.internal'],
  ['an IPv4 prefix over 32', '10.0.0.0/33'],
  ['an IPv6 prefix over 128', '2001:db8::/129'],
  ['a non-numeric prefix', '10.0.0.0/eight'],
  ['a signed prefix', '10.0.0.0/+8'],
  ['an empty prefix', '10.0.0.0/'],
  ['two slashes', '10.0.0.0/8/8'],
  ['a partial address', '10.0.0'],
  ['a number', 10],
  ['null', null],
])('parseIpRange returns null for %s', (_, value) => {
  expect(parseIpRange(value)).toBe(null);
});
