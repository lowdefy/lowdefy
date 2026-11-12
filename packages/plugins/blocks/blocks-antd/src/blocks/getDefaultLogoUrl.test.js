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

import getDefaultLogoUrl from './getDefaultLogoUrl.js';

test('getDefaultLogoUrl addresses the logo from the root when the app has no base', () => {
  expect(getDefaultLogoUrl({ apiBase: '', darkMode: false, square: false })).toBe(
    '/logo-light-theme.png'
  );
  expect(getDefaultLogoUrl({ apiBase: '', darkMode: true, square: false })).toBe(
    '/logo-dark-theme.png'
  );
});

test('getDefaultLogoUrl addresses the square logo', () => {
  expect(getDefaultLogoUrl({ apiBase: '', darkMode: false, square: true })).toBe(
    '/logo-square-light-theme.png'
  );
  expect(getDefaultLogoUrl({ apiBase: '', darkMode: true, square: true })).toBe(
    '/logo-square-dark-theme.png'
  );
});

test('getDefaultLogoUrl keeps the basePath of an app served under a path', () => {
  expect(getDefaultLogoUrl({ apiBase: '/app', darkMode: false, square: false })).toBe(
    '/app/logo-light-theme.png'
  );
});

test('getDefaultLogoUrl addresses the logo on the origin of the app for a view', () => {
  expect(
    getDefaultLogoUrl({ apiBase: 'https://app.example.com/app', darkMode: true, square: true })
  ).toBe('https://app.example.com/app/logo-square-dark-theme.png');
});
