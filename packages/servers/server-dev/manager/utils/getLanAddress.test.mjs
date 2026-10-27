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

import { expect, test } from 'vitest';
import getLanAddress from './getLanAddress.mjs';

const interfaces = {
  lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
  utun4: [{ address: '100.92.10.3', family: 'IPv4', internal: false }],
  bridge100: [
    { address: 'fe80::1', family: 'IPv6', internal: false },
    { address: '192.168.64.1', family: 4, internal: false },
  ],
  en0: [{ address: '10.0.0.12', family: 'IPv4', internal: false }],
};

test('getLanAddress takes the first private IPv4 address and names its interface', () => {
  expect(getLanAddress({ interfaces })).toEqual({ name: 'bridge100', address: '192.168.64.1' });
});

test('getLanAddress skips addresses outside the private ranges, such as a VPN address', () => {
  const vpnFirst = {
    utun4: [{ address: '100.92.10.3', family: 'IPv4', internal: false }],
    en0: [{ address: '172.20.1.9', family: 'IPv4', internal: false }],
  };
  expect(getLanAddress({ interfaces: vpnFirst })).toEqual({ name: 'en0', address: '172.20.1.9' });
});

test('getLanAddress takes a named interface', () => {
  expect(getLanAddress({ interfaceName: 'en0', interfaces })).toEqual({
    name: 'en0',
    address: '10.0.0.12',
  });
  expect(getLanAddress({ interfaceName: 'utun4', interfaces })).toEqual({
    name: 'utun4',
    address: '100.92.10.3',
  });
});

test('getLanAddress lists the interfaces when the named one has no IPv4 address', () => {
  expect(() => getLanAddress({ interfaceName: 'en7', interfaces })).toThrow(
    'Network interface "en7" has no IPv4 address. Interfaces with an IPv4 address: utun4 (100.92.10.3), bridge100 (192.168.64.1), en0 (10.0.0.12).'
  );
});

test('getLanAddress says how to choose when no address is private', () => {
  expect(() =>
    getLanAddress({
      interfaces: { utun4: [{ address: '100.92.10.3', family: 'IPv4', internal: false }] },
    })
  ).toThrow(
    'No private network address found for --lan. Interfaces with an IPv4 address: utun4 (100.92.10.3). Pass one with --lan <interface>.'
  );
  expect(() => getLanAddress({ interfaces: {} })).toThrow(
    'This computer has no network interface with an IPv4 address.'
  );
});
