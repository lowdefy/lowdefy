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

import createMemoryStore from '../host/createMemoryStore.js';
import createShellLocale from './createShellLocale.js';

const i18n = {
  defaultLocale: 'en-US',
  locales: [
    { code: 'en-US', dayjs: 'en' },
    { code: 'af-ZA', dayjs: 'af' },
  ],
  messages: {},
};

function createLocale(rootI18n) {
  const lowdefy = {};
  const session = {
    getState: () => ({ lowdefy, rootConfig: { i18n: rootI18n, lowdefyApp: { slug: 'field' } } }),
  };
  const globals = { window: {} };
  const storage = createMemoryStore();
  const locale = createShellLocale({
    getDeviceLocales: () => ['en-ZA'],
    globals,
    session,
    storage,
  });
  return { globals, locale, lowdefy, storage };
}

test('createShellLocale points lowdefy.i18n and the window at the active locale', () => {
  const { globals, locale, lowdefy } = createLocale(i18n);
  locale.apply();
  expect(lowdefy.i18n).toEqual({ ...i18n, active: 'en-US' });
  expect(globals.window.__lowdefy_locale).toBe('en-US');
  expect(globals.window.__lowdefy_supported_locales).toBe(i18n.locales);
});

test('SetLocale sets the choice through the window, keeps it and tells the screens', () => {
  const { globals, locale, lowdefy, storage } = createLocale(i18n);
  const listener = jest.fn();
  locale.subscribe(listener);
  globals.window.__lowdefy_setLocale('af-ZA');
  expect(lowdefy.i18n.active).toBe('af-ZA');
  expect(storage.get('lowdefy:field::lowdefy_locale')).toBe('af-ZA');
  expect(listener).toHaveBeenCalledTimes(1);
  expect(locale.getVersion()).toBe(1);
  globals.window.__lowdefy_setLocale('auto');
  expect(storage.keys()).toEqual([]);
  expect(lowdefy.i18n.active).toBe('en-US');
});

test('createShellLocale leaves an app without i18n alone', () => {
  const { globals, locale, lowdefy } = createLocale({});
  locale.apply();
  expect(lowdefy.i18n).toBeUndefined();
  expect(globals.window.__lowdefy_locale).toBeUndefined();
});
