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

import getUrlCellHref from './getUrlCellHref.js';
import { expect, test } from 'vitest';

test('getUrlCellHref passes http, https, protocol and root relative URLs', () => {
  expect(getUrlCellHref('https://a.test/x')).toBe('https://a.test/x');
  expect(getUrlCellHref('HTTP://a.test')).toBe('HTTP://a.test');
  expect(getUrlCellHref('//a.test')).toBe('//a.test');
  expect(getUrlCellHref('/docs')).toBe('/docs');
});

test('getUrlCellHref adds https to a bare domain', () => {
  expect(getUrlCellHref(' lowdefy.com ')).toBe('https://lowdefy.com');
  expect(getUrlCellHref('lowdefy.com/docs?x=1')).toBe('https://lowdefy.com/docs?x=1');
});

test('getUrlCellHref trims surrounding spaces', () => {
  expect(getUrlCellHref('  https://a.test  ')).toBe('https://a.test');
});

test('getUrlCellHref returns undefined for other schemes and empty values', () => {
  expect(getUrlCellHref('javascript:alert(1)')).toBeUndefined();
  expect(getUrlCellHref(' javascript:alert(1)')).toBeUndefined();
  expect(getUrlCellHref('java\tscript:alert(1)')).toBeUndefined();
  expect(getUrlCellHref('data:text/html,x')).toBeUndefined();
  expect(getUrlCellHref('file:///etc/hosts')).toBeUndefined();
  expect(getUrlCellHref('')).toBeUndefined();
  expect(getUrlCellHref('   ')).toBeUndefined();
});
