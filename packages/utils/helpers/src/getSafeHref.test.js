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

import getSafeHref from './getSafeHref.js';

test('getSafeHref passes http and https URLs in any case', () => {
  expect(getSafeHref('https://a.test/x')).toBe('https://a.test/x');
  expect(getSafeHref('http://a.test')).toBe('http://a.test');
  expect(getSafeHref('HTTP://a.test')).toBe('HTTP://a.test');
  expect(getSafeHref('HtTpS://a.test/x?y=1#z')).toBe('HtTpS://a.test/x?y=1#z');
});

test('getSafeHref passes mailto and tel URLs', () => {
  expect(getSafeHref('mailto:a@b.test')).toBe('mailto:a@b.test');
  expect(getSafeHref('MAILTO:a@b.test?subject=Hi')).toBe('MAILTO:a@b.test?subject=Hi');
  expect(getSafeHref('tel:+27123456789')).toBe('tel:+27123456789');
});

test('getSafeHref passes the other schemes DOMPurify allows by default', () => {
  expect(getSafeHref('ftp://a.test/file')).toBe('ftp://a.test/file');
  expect(getSafeHref('ftps://a.test/file')).toBe('ftps://a.test/file');
  expect(getSafeHref('sms:+27123456789')).toBe('sms:+27123456789');
  expect(getSafeHref('callto:someone')).toBe('callto:someone');
  expect(getSafeHref('cid:part1@a.test')).toBe('cid:part1@a.test');
  expect(getSafeHref('xmpp:a@b.test')).toBe('xmpp:a@b.test');
  expect(getSafeHref('matrix:u/a:b.test')).toBe('matrix:u/a:b.test');
});

test('getSafeHref passes protocol relative and root relative URLs', () => {
  expect(getSafeHref('//a.test')).toBe('//a.test');
  expect(getSafeHref('/docs')).toBe('/docs');
  expect(getSafeHref('/path:1')).toBe('/path:1');
});

test('getSafeHref passes relative paths', () => {
  expect(getSafeHref('docs/intro')).toBe('docs/intro');
  expect(getSafeHref('./docs')).toBe('./docs');
  expect(getSafeHref('../docs')).toBe('../docs');
  expect(getSafeHref('lowdefy.com')).toBe('lowdefy.com');
  expect(getSafeHref('a/b:c')).toBe('a/b:c');
});

test('getSafeHref passes query-only and fragment URLs', () => {
  expect(getSafeHref('?tab=2')).toBe('?tab=2');
  expect(getSafeHref('#section')).toBe('#section');
  expect(getSafeHref('#')).toBe('#');
});

test('getSafeHref passes a value with trailing spaces unchanged', () => {
  expect(getSafeHref('https://a.test ')).toBe('https://a.test ');
});

test('getSafeHref returns undefined for script schemes in any case', () => {
  expect(getSafeHref('javascript:alert(1)')).toBeUndefined();
  expect(getSafeHref('JavaScript:alert(1)')).toBeUndefined();
  expect(getSafeHref('JAVASCRIPT:alert(1)')).toBeUndefined();
  expect(getSafeHref('vbscript:msgbox(1)')).toBeUndefined();
  expect(getSafeHref('VBScript:msgbox(1)')).toBeUndefined();
  expect(getSafeHref('data:text/html,x')).toBeUndefined();
  expect(getSafeHref('Data:text/html;base64,PHNjcmlwdD4=')).toBeUndefined();
});

test('getSafeHref returns undefined for other schemes', () => {
  expect(getSafeHref('file:///etc/hosts')).toBeUndefined();
  expect(getSafeHref('blob:https://a.test/1')).toBeUndefined();
  expect(getSafeHref('slack://open')).toBeUndefined();
  expect(getSafeHref('localhost:3000')).toBeUndefined();
  expect(getSafeHref('c:\\docs')).toBeUndefined();
});

test('getSafeHref returns undefined for control characters anywhere', () => {
  expect(getSafeHref('java\tscript:alert(1)')).toBeUndefined();
  expect(getSafeHref('java\nscript:alert(1)')).toBeUndefined();
  expect(getSafeHref('java\rscript:alert(1)')).toBeUndefined();
  expect(getSafeHref('java\u0000script:alert(1)')).toBeUndefined();
  expect(getSafeHref('javascript\u007f:alert(1)')).toBeUndefined();
  expect(getSafeHref('https://a.test/\tx')).toBeUndefined();
  expect(getSafeHref('/\t/a.test')).toBeUndefined();
});

test('getSafeHref returns undefined for leading whitespace or control characters', () => {
  expect(getSafeHref(' javascript:alert(1)')).toBeUndefined();
  expect(getSafeHref('\u0001javascript:alert(1)')).toBeUndefined();
  expect(getSafeHref('\u00a0javascript:alert(1)')).toBeUndefined();
  expect(getSafeHref('\tjavascript:alert(1)')).toBeUndefined();
  expect(getSafeHref(' https://a.test')).toBeUndefined();
});

test('getSafeHref returns undefined for empty and non-string values', () => {
  expect(getSafeHref('')).toBeUndefined();
  expect(getSafeHref(undefined)).toBeUndefined();
  expect(getSafeHref(null)).toBeUndefined();
  expect(getSafeHref(5)).toBeUndefined();
  expect(getSafeHref(true)).toBeUndefined();
  expect(getSafeHref({ href: 'https://a.test' })).toBeUndefined();
  expect(getSafeHref(['https://a.test'])).toBeUndefined();
});
