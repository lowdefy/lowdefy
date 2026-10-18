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

import isLoopbackHost from './isLoopbackHost.js';
import parseDevLink from './parseDevLink.js';
import parseServerInput from './parseServerInput.js';

const scheme = 'lowdefy-dev';

test('a connect link from lowdefy dev --lan gives the server and its pairing token', () => {
  expect(
    parseDevLink({
      link: 'lowdefy-dev://connect?url=http%3A%2F%2F192.168.1.20%3A3000%2F&pair=k3x9q',
      scheme,
    })
  ).toEqual({
    kind: 'connect',
    url: 'http://192.168.1.20:3000',
    host: '192.168.1.20:3000',
    pair: 'k3x9q',
  });
});

test('a connect link from lowdefy dev --ios has no pairing token', () => {
  expect(
    parseDevLink({ link: 'lowdefy-dev://connect?url=http%3A%2F%2Flocalhost%3A3000', scheme })
  ).toEqual({ kind: 'connect', url: 'http://localhost:3000', host: 'localhost:3000', pair: null });
});

test('a menu link opens the dev menu', () => {
  expect(parseDevLink({ link: 'lowdefy-dev://menu', scheme })).toEqual({ kind: 'menu' });
});

test('a connect link without a server url is invalid', () => {
  expect(parseDevLink({ link: 'lowdefy-dev://connect?url=ftp%3A%2F%2Fx', scheme })).toEqual({
    kind: 'invalid',
    reason: 'The link has no dev server url. Received "ftp://x".',
  });
});

test('links that are not Lowdefy Dev links are left to the router', () => {
  expect(parseDevLink({ link: 'lowdefy-dev://tickets/7', scheme })).toBeNull();
  expect(parseDevLink({ link: 'field://connect?url=http%3A%2F%2Fx', scheme })).toBeNull();
  expect(parseDevLink({ link: '/tickets/7', scheme })).toBeNull();
});

test('the connect screen reads a typed address or a pasted link', () => {
  expect(parseServerInput({ input: ' 192.168.1.20:3000 ', scheme })).toEqual({
    url: 'http://192.168.1.20:3000',
    host: '192.168.1.20:3000',
    pair: null,
  });
  expect(
    parseServerInput({
      input: 'lowdefy-dev://connect?url=http%3A%2F%2F192.168.1.20%3A3000&pair=k3x9q',
      scheme,
    })
  ).toEqual({ url: 'http://192.168.1.20:3000', host: '192.168.1.20:3000', pair: 'k3x9q' });
  expect(parseServerInput({ input: 'not a server', scheme }).error).toMatch(/Enter the address/);
});

test.each([
  ['localhost:3000', true],
  ['127.0.0.1:3000', true],
  ['[::1]:3000', true],
  ['192.168.1.20:3000', false],
  ['localhost.example.com', false],
])('isLoopbackHost(%s) is %s', (host, expected) => {
  expect(isLoopbackHost(host)).toBe(expected);
});
