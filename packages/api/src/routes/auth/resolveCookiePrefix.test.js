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

import resolveCookiePrefix from './resolveCookiePrefix.js';

test('returns "lowdefy" in production regardless of appMeta', () => {
  expect(resolveCookiePrefix({ appMeta: { slug: 'my-app' }, dev: false })).toBe('lowdefy');
  expect(resolveCookiePrefix({ appMeta: {}, dev: false })).toBe('lowdefy');
  expect(resolveCookiePrefix({ appMeta: undefined, dev: false })).toBe('lowdefy');
});

test('returns "lowdefy" in dev when appMeta has neither slug nor name', () => {
  expect(resolveCookiePrefix({ appMeta: {}, dev: true })).toBe('lowdefy');
  expect(resolveCookiePrefix({ appMeta: undefined, dev: true })).toBe('lowdefy');
});

test('derives prefix from appMeta.slug in dev', () => {
  expect(resolveCookiePrefix({ appMeta: { slug: 'my-app' }, dev: true })).toBe('lowdefy-my-app');
});

test('falls back to appMeta.name in dev when slug is not set', () => {
  expect(resolveCookiePrefix({ appMeta: { name: 'My App' }, dev: true })).toBe('lowdefy-my-app');
});

test('prefers appMeta.slug over appMeta.name in dev', () => {
  expect(
    resolveCookiePrefix({ appMeta: { slug: 'the-slug', name: 'The Name' }, dev: true })
  ).toBe('lowdefy-the-slug');
});

test('slugifies non-alphanumeric characters in dev', () => {
  expect(resolveCookiePrefix({ appMeta: { slug: 'My App! 2.0' }, dev: true })).toBe(
    'lowdefy-my-app-2-0'
  );
});

test('trims leading and trailing dashes produced by slugification in dev', () => {
  expect(resolveCookiePrefix({ appMeta: { slug: '--My App--' }, dev: true })).toBe(
    'lowdefy-my-app'
  );
});
