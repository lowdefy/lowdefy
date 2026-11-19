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

import getBrowserUrl from './getBrowserUrl.js';

const origin = 'https://app.example.com';
const location = { path: 'settings', pathname: '/base/settings', search: '?tab=team' };

test('getBrowserUrl gives the absolute app URL of a page that is not a view page', () => {
  expect(
    getBrowserUrl({ fetched: { shown: false, status: 404, surface: 'web' }, location, origin })
  ).toBe('https://app.example.com/base/settings?tab=team');
  expect(
    getBrowserUrl({ fetched: { shown: false, status: 404, surface: 'both' }, location, origin })
  ).toBe('https://app.example.com/base/settings?tab=team');
});

test('getBrowserUrl gives null for a path that names no page', () => {
  expect(
    getBrowserUrl({ fetched: { shown: false, status: 404, surface: undefined }, location, origin })
  ).toBeNull();
});

test('getBrowserUrl gives null for a page for phones only', () => {
  expect(
    getBrowserUrl({ fetched: { shown: false, status: 404, surface: 'mobile' }, location, origin })
  ).toBeNull();
});

test('getBrowserUrl gives null for any other refusal', () => {
  [401, 403, 409, 500].forEach((status) => {
    expect(
      getBrowserUrl({ fetched: { shown: false, status, surface: 'web' }, location, origin })
    ).toBeNull();
  });
});
