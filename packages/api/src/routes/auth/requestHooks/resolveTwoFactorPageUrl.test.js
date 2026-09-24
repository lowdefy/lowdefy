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

import resolveTwoFactorPageUrl from './resolveTwoFactorPageUrl.js';

test('resolveTwoFactorPageUrl returns an absolute url when the base origin is pinned', () => {
  expect(
    resolveTwoFactorPageUrl({
      authConfig: { authPages: { twoFactor: '/two-factor' } },
      baseUrlOrigin: 'https://app.example.com',
    })
  ).toBe('https://app.example.com/two-factor');
});

test('resolveTwoFactorPageUrl prefixes the app basePath', () => {
  expect(
    resolveTwoFactorPageUrl({
      authConfig: { authPages: { twoFactor: '/two-factor' } },
      basePath: '/app',
      baseUrlOrigin: 'https://app.example.com',
    })
  ).toBe('https://app.example.com/app/two-factor');
});

test('resolveTwoFactorPageUrl returns a path-relative url when no base origin is pinned', () => {
  expect(
    resolveTwoFactorPageUrl({
      authConfig: { authPages: { twoFactor: '/two-factor' } },
      basePath: '/app',
    })
  ).toBe('/app/two-factor');
});

test('resolveTwoFactorPageUrl returns undefined when no two factor page is configured', () => {
  expect(
    resolveTwoFactorPageUrl({
      authConfig: { authPages: { signIn: '/login' } },
      baseUrlOrigin: 'https://app.example.com',
    })
  ).toBeUndefined();
});

test('resolveTwoFactorPageUrl returns undefined when authPages is absent', () => {
  expect(resolveTwoFactorPageUrl({ authConfig: {} })).toBeUndefined();
});
