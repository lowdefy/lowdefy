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

import isAllowedUrl from './isAllowedUrl.js';

const policy = { links: { pages: ['thanks'], origins: ['https://example.com'] } };

function allowed(value, options = {}) {
  return isAllowedUrl({ value, policy, navigation: false, schemeless: false, ...options });
}

test('isAllowedUrl allows listed origins and same-origin loads', () => {
  expect(allowed('https://example.com/a.png')).toBe(true);
  expect(allowed('/logo.png')).toBe(true);
  expect(allowed('#section')).toBe(true);
  expect(allowed('')).toBe(true);
});

test('isAllowedUrl rejects other origins, non-http schemes and off-app relative forms', () => {
  expect(allowed('https://evil.test/a.png')).toBe(false);
  expect(allowed('//evil.test/a.png')).toBe(false);
  expect(allowed('/\\evil.test/a.png')).toBe(false);
  expect(allowed('javascript:alert(1)')).toBe(false);
  expect(allowed('mailto:a@example.com')).toBe(false);
});

test('isAllowedUrl limits same-origin navigation to listed pages', () => {
  expect(allowed('/thanks?x=1#top', { navigation: true })).toBe(true);
  expect(allowed('/admin', { navigation: true })).toBe(false);
});

test('isAllowedUrl reads a colon-less url as an https host, as Link does', () => {
  expect(allowed('example.com', { navigation: true, schemeless: true })).toBe(true);
  expect(allowed('evil.test', { navigation: true, schemeless: true })).toBe(false);
});
