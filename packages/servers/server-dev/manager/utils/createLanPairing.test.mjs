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

import createLanPairing from './createLanPairing.mjs';

const interfaces = {
  en0: [{ address: '192.168.1.20', family: 'IPv4', internal: false }],
  en5: [{ address: '10.1.1.4', family: 'IPv4', internal: false }],
};

test('createLanPairing returns null when --lan is off', () => {
  expect(createLanPairing({ lan: undefined, interfaces })).toBe(null);
});

test('createLanPairing picks the private address and a 32-byte token', () => {
  const pairing = createLanPairing({ lan: 'true', interfaces });
  expect(pairing).toMatchObject({ name: 'en0', address: '192.168.1.20' });
  expect(Buffer.from(pairing.token, 'base64url')).toHaveLength(32);
});

test('createLanPairing takes the interface --lan names', () => {
  expect(createLanPairing({ lan: 'en5', interfaces })).toMatchObject({
    name: 'en5',
    address: '10.1.1.4',
  });
});

test('createLanPairing makes a new token each session', () => {
  expect(createLanPairing({ lan: 'true', interfaces }).token).not.toEqual(
    createLanPairing({ lan: 'true', interfaces }).token
  );
});
