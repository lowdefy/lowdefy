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

import isPageContentPath from './isPageContentPath.js';

test('returns false for non-pages paths', () => {
  expect(isPageContentPath('connections.0.properties')).toBe(false);
  expect(isPageContentPath('menus.0.links')).toBe(false);
  expect(isPageContentPath('auth.pages')).toBe(false);
});

test('returns false for page-level paths with no content key', () => {
  expect(isPageContentPath('pages.0')).toBe(false);
  expect(isPageContentPath('pages._build.array.concat.0')).toBe(false);
  expect(isPageContentPath('pages._build.if.then')).toBe(false);
});

test('returns false for page metadata paths', () => {
  expect(isPageContentPath('pages.0.id')).toBe(false);
  expect(isPageContentPath('pages.0.type')).toBe(false);
  expect(isPageContentPath('pages._build.array.concat.0.auth')).toBe(false);
});

test('returns true for direct content keys on static array pages', () => {
  expect(isPageContentPath('pages.0.blocks')).toBe(true);
  expect(isPageContentPath('pages.0.events')).toBe(true);
  expect(isPageContentPath('pages.1.requests')).toBe(true);
  expect(isPageContentPath('pages.0.areas')).toBe(true);
  expect(isPageContentPath('pages.0.layout')).toBe(true);
});

test('returns true for content keys through _build.array', () => {
  expect(isPageContentPath('pages._build.array.concat.0.blocks.0')).toBe(true);
  expect(isPageContentPath('pages._build.array.concat.0.events.onClick')).toBe(true);
});

test('returns true for content keys through _build.if', () => {
  expect(isPageContentPath('pages._build.if.then.0.blocks')).toBe(true);
  expect(isPageContentPath('pages._build.if.else.0.blocks')).toBe(true);
});

test('returns true for nested content inside blocks', () => {
  expect(isPageContentPath('pages.0.blocks.0.blocks.1.properties')).toBe(true);
  expect(isPageContentPath('pages._build.array.concat.0.blocks.0.events.onClick')).toBe(true);
});

test('returns false for empty path', () => {
  expect(isPageContentPath('')).toBe(false);
});

test('returns false when path is exactly "pages"', () => {
  expect(isPageContentPath('pages')).toBe(false);
});
