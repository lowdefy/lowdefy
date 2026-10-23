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
import buildAuthMobile from './buildAuthMobile.js';

test('buildAuthMobile leaves auth alone for an app without a mobile key', () => {
  const components = { auth: { configured: true } };
  buildAuthMobile({ components });
  expect(components.auth).toEqual({ configured: true });
});

test('buildAuthMobile writes the shells that have a scheme and the phone session lifetime', () => {
  const components = {
    auth: { configured: true },
    mobile: {
      shells: [
        {
          id: 'field',
          scheme: 'com.example.field',
          ios: { bundleId: 'com.example.field' },
          android: { package: 'com.example.field', sha256: 'AA:BB' },
        },
        { id: 'iosOnly', scheme: 'com.example.ios' },
        { id: 'noScheme' },
      ],
      auth: { sessionExpiresIn: 2592000, unlock: 'biometric' },
    },
  };
  buildAuthMobile({ components });
  expect(components.auth.mobile).toEqual({
    shells: [
      { id: 'field', scheme: 'com.example.field', androidAppLink: true },
      { id: 'iosOnly', scheme: 'com.example.ios', androidAppLink: false },
    ],
    sessionExpiresIn: 2592000,
  });
});

test('buildAuthMobile writes no phone session lifetime when mobile.auth does not set one', () => {
  const components = { auth: { configured: true }, mobile: {} };
  buildAuthMobile({ components });
  expect(components.auth.mobile).toEqual({ shells: [], sessionExpiresIn: null });
});
