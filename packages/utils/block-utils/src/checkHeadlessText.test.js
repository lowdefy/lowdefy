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

import checkHeadlessText from './checkHeadlessText.js';

test('checkHeadlessText accepts a list of property paths', () => {
  expect(() =>
    checkHeadlessText({ blockType: 'app_Banner', headlessText: ['title', 'body.text'] })
  ).not.toThrow();
});

test('checkHeadlessText accepts a meta that declares none', () => {
  expect(() => checkHeadlessText({ blockType: 'app_Banner' })).not.toThrow();
  expect(() => checkHeadlessText({ blockType: 'app_Banner', headlessText: null })).not.toThrow();
});

test('checkHeadlessText refuses a value that is not a list, naming the block type', () => {
  expect(() => checkHeadlessText({ blockType: 'app_Banner', headlessText: 'title' })).toThrow(
    'Block type app_Banner declares headlessText as "title": it should be a list of the property paths the block draws as text'
  );
});

test('checkHeadlessText refuses a path that is not a non-empty string, naming its index', () => {
  expect(() => checkHeadlessText({ blockType: 'app_Banner', headlessText: ['title', ''] })).toThrow(
    'Block type app_Banner declares headlessText[1] as "": it should be the path'
  );
  expect(() =>
    checkHeadlessText({ blockType: 'app_Banner', headlessText: [{ path: 'title' }] })
  ).toThrow('Block type app_Banner declares headlessText[0] as {"path":"title"}');
});

// A bad declaration is a mistake in the plugin's meta, so it fails as a ConfigError, not as a
// Lowdefy internal error, with the declaration as the value received.
test('checkHeadlessText throws a ConfigError with the declaration received', () => {
  let error;
  try {
    checkHeadlessText({ blockType: 'app_Banner', headlessText: ['title', ''] });
  } catch (caught) {
    error = caught;
  }
  expect(error.name).toBe('ConfigError');
  expect(error.received).toEqual(['title', '']);
});
