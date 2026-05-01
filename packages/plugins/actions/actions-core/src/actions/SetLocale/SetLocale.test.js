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

import { jest } from '@jest/globals';
import SetLocale from './SetLocale.js';

const mockSetLocale = jest.fn();
const mockSetGlobal = jest.fn();

const globals = { window: { __lowdefy_setLocale: mockSetLocale } };
const methods = { setGlobal: mockSetGlobal };

beforeEach(() => {
  mockSetLocale.mockReset();
  mockSetGlobal.mockReset();
});

test('SetLocale forwards the locale to window.__lowdefy_setLocale', () => {
  SetLocale({ globals, methods, params: { locale: 'de-DE' } });
  expect(mockSetLocale).toHaveBeenCalledWith('de-DE');
});

test('SetLocale defaults to "auto" when no locale is provided', () => {
  SetLocale({ globals, methods, params: {} });
  expect(mockSetLocale).toHaveBeenCalledWith('auto');
});

test('SetLocale calls setGlobal to trigger a re-render', () => {
  SetLocale({ globals, methods, params: { locale: 'en-US' } });
  expect(mockSetGlobal).toHaveBeenCalledWith({});
});

test('SetLocale is a no-op when window.__lowdefy_setLocale is missing', () => {
  expect(() =>
    SetLocale({ globals: { window: {} }, methods, params: { locale: 'de-DE' } })
  ).not.toThrow();
  expect(mockSetGlobal).toHaveBeenCalledWith({});
});
