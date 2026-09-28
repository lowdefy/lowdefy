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

import getSafeUrl from './getSafeUrl.js';

test('getSafeUrl passes http, https, protocol and root relative URLs', () => {
  expect(getSafeUrl('https://a.test/x')).toBe('https://a.test/x');
  expect(getSafeUrl('HTTP://a.test')).toBe('HTTP://a.test');
  expect(getSafeUrl('//a.test')).toBe('//a.test');
  expect(getSafeUrl('/docs')).toBe('/docs');
});

test('getSafeUrl adds https to a bare domain', () => {
  expect(getSafeUrl(' lowdefy.com ')).toBe('https://lowdefy.com');
});

test('getSafeUrl refuses other schemes and empty values', () => {
  expect(getSafeUrl('javascript:alert(1)')).toBeNull();
  expect(getSafeUrl('data:text/html,x')).toBeNull();
  expect(getSafeUrl('')).toBeNull();
  expect(getSafeUrl(5)).toBeNull();
});
