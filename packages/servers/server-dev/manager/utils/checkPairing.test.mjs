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
import checkPairing from './checkPairing.mjs';

const TOKEN = 'k'.repeat(43);

test.each(['127.0.0.1', '::1', '::ffff:127.0.0.1'])(
  'checkPairing lets a loopback request (%s) through without a token',
  (remoteAddress) => {
    expect(checkPairing({ remoteAddress, pairToken: TOKEN })).toBe('local');
    expect(checkPairing({ remoteAddress, pairToken: undefined })).toBe('local');
  }
);

test('checkPairing refuses a LAN request without the token', () => {
  expect(checkPairing({ remoteAddress: '192.168.1.40', pairToken: TOKEN })).toBe('refused');
});

test('checkPairing refuses a LAN request with the wrong token', () => {
  expect(
    checkPairing({ remoteAddress: '192.168.1.40', pairToken: TOKEN, providedToken: 'k'.repeat(42) })
  ).toBe('refused');
  expect(
    checkPairing({ remoteAddress: '192.168.1.40', pairToken: TOKEN, providedToken: 'x'.repeat(43) })
  ).toBe('refused');
});

test('checkPairing pairs a LAN request with the token', () => {
  expect(
    checkPairing({ remoteAddress: '::ffff:192.168.1.40', pairToken: TOKEN, providedToken: TOKEN })
  ).toBe('paired');
});

test('checkPairing refuses every LAN request when the session has no token', () => {
  expect(
    checkPairing({ remoteAddress: '192.168.1.40', pairToken: undefined, providedToken: TOKEN })
  ).toBe('refused');
});
