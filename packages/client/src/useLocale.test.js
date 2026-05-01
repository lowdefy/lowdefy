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

/* eslint-disable no-global-assign */
import { jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';

const dayjsLocale = jest.fn();

jest.unstable_mockModule('dayjs', () => ({
  default: { locale: dayjsLocale },
}));

const { default: useLocale } = await import('./useLocale.js');

const i18n = {
  defaultLocale: 'en-US',
  fallbackLocale: 'en-US',
  locales: [
    { code: 'en-US', label: 'English', antd: 'en_US', dayjs: 'en' },
    { code: 'de-DE', label: 'Deutsch', antd: 'de_DE', dayjs: 'de' },
  ],
};

const antdLocaleLoaders = {
  'en-US': jest.fn().mockResolvedValue({ default: { name: 'en_US-locale' } }),
  'de-DE': jest.fn().mockResolvedValue({ default: { name: 'de_DE-locale' } }),
};

const dayjsLocaleMap = { 'en-US': 'en', 'de-DE': 'de' };

beforeEach(() => {
  window.localStorage.clear();
  delete window.__lowdefy_setLocale;
  delete window.__lowdefy_locale;
  dayjsLocale.mockReset();
  antdLocaleLoaders['en-US'].mockClear();
  antdLocaleLoaders['de-DE'].mockClear();
  Object.defineProperty(window.navigator, 'languages', {
    value: ['en-US'],
    configurable: true,
  });
});

test('returns the default locale when no preference and no browser match', () => {
  Object.defineProperty(window.navigator, 'languages', {
    value: ['fr-FR'],
    configurable: true,
  });
  const { result } = renderHook(() => useLocale({ i18n, antdLocaleLoaders, dayjsLocaleMap }));
  expect(result.current.active).toBe('en-US');
});

test('matches the browser language by primary tag when exact code is unavailable', () => {
  Object.defineProperty(window.navigator, 'languages', {
    value: ['de'],
    configurable: true,
  });
  const { result } = renderHook(() => useLocale({ i18n, antdLocaleLoaders, dayjsLocaleMap }));
  expect(result.current.active).toBe('de-DE');
});

test('user preference in localStorage takes precedence over browser', () => {
  window.localStorage.setItem('lowdefy_locale', 'de-DE');
  Object.defineProperty(window.navigator, 'languages', {
    value: ['en-US'],
    configurable: true,
  });
  const { result } = renderHook(() => useLocale({ i18n, antdLocaleLoaders, dayjsLocaleMap }));
  expect(result.current.active).toBe('de-DE');
});

test('exposes setPreference via window.__lowdefy_setLocale', () => {
  const { result, rerender } = renderHook(() =>
    useLocale({ i18n, antdLocaleLoaders, dayjsLocaleMap })
  );
  act(() => {
    window.__lowdefy_setLocale('de-DE');
  });
  rerender();
  expect(result.current.active).toBe('de-DE');
  expect(window.localStorage.getItem('lowdefy_locale')).toBe('de-DE');
});

test('passing "auto" clears the user preference', () => {
  window.localStorage.setItem('lowdefy_locale', 'de-DE');
  const { result, rerender } = renderHook(() =>
    useLocale({ i18n, antdLocaleLoaders, dayjsLocaleMap })
  );
  expect(result.current.active).toBe('de-DE');
  act(() => {
    window.__lowdefy_setLocale('auto');
  });
  rerender();
  expect(window.localStorage.getItem('lowdefy_locale')).toBeNull();
});

test('loads the antd locale module for the active locale', async () => {
  const { result } = renderHook(() => useLocale({ i18n, antdLocaleLoaders, dayjsLocaleMap }));
  await waitFor(() => expect(result.current.antdLocale).toEqual({ name: 'en_US-locale' }));
  expect(antdLocaleLoaders['en-US']).toHaveBeenCalled();
});

test('calls dayjs.locale for the active locale', async () => {
  renderHook(() => useLocale({ i18n, antdLocaleLoaders, dayjsLocaleMap }));
  await waitFor(() => expect(dayjsLocale).toHaveBeenCalledWith('en'));
});

test('writes window.__lowdefy_locale with the active code', () => {
  renderHook(() => useLocale({ i18n, antdLocaleLoaders, dayjsLocaleMap }));
  expect(window.__lowdefy_locale).toBe('en-US');
});

test('writes window.__lowdefy_supported_locales with the configured list', () => {
  renderHook(() => useLocale({ i18n, antdLocaleLoaders, dayjsLocaleMap }));
  expect(window.__lowdefy_supported_locales).toEqual(i18n.locales);
});

test('writes empty supported_locales when no i18n config', () => {
  renderHook(() =>
    useLocale({ i18n: undefined, antdLocaleLoaders: {}, dayjsLocaleMap: {} })
  );
  expect(window.__lowdefy_supported_locales).toEqual([]);
});

test('returns undefined active when i18n config is empty', () => {
  const { result } = renderHook(() =>
    useLocale({ i18n: undefined, antdLocaleLoaders: {}, dayjsLocaleMap: {} })
  );
  expect(result.current.active).toBeUndefined();
});
