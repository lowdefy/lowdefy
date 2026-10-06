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

import isPublicAddress from './isPublicAddress.js';

test.each([
  ['0.0.0.0'],
  ['10.0.0.1'],
  ['100.64.0.1'],
  ['127.0.0.1'],
  ['127.255.255.254'],
  ['169.254.169.254'],
  ['172.16.0.1'],
  ['172.31.255.255'],
  ['192.168.1.1'],
  ['224.0.0.1'],
  ['255.255.255.255'],
  ['::'],
  ['::1'],
  ['::ffff:127.0.0.1'],
  ['::ffff:a00:1'],
  ['fc00::1'],
  ['fd12:3456::1'],
  ['fe80::1'],
  ['ff02::1'],
])('isPublicAddress refuses %s', (address) => {
  expect(isPublicAddress(address)).toBe(false);
});

test.each([
  ['1.1.1.1'],
  ['8.8.8.8'],
  ['52.95.110.1'],
  ['172.32.0.1'],
  ['100.128.0.1'],
  ['2606:4700:4700::1111'],
  ['2a00:1450:4001::200e'],
  ['::ffff:8.8.8.8'],
])('isPublicAddress allows %s', (address) => {
  expect(isPublicAddress(address)).toBe(true);
});
