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
import { renderHook, act } from '@testing-library/react';

jest.unstable_mockModule('antd', () => {
  const defaultAlgorithm = (seed) => ({ ...seed, __algo: 'default' });
  const darkAlgorithm = (seed) => ({ ...seed, __algo: 'dark' });
  const compactAlgorithm = (seed) => ({ ...seed, __algo: 'compact' });
  return {
    theme: {
      defaultAlgorithm,
      darkAlgorithm,
      compactAlgorithm,
    },
  };
});

const { default: useDarkMode } = await import('./useDarkMode.js');

function setupMatchMedia(matches) {
  const listeners = new Set();
  window.matchMedia = jest.fn().mockImplementation(() => ({
    matches,
    addEventListener: (_, cb) => listeners.add(cb),
    removeEventListener: (_, cb) => listeners.delete(cb),
  }));
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('style');
  delete window.__lowdefy_setDarkMode;
  delete window.__lowdefy_isDark;
  setupMatchMedia(false);
});

test('returns algorithm, token and components', () => {
  const { result } = renderHook(() =>
    useDarkMode({ antd: { token: { colorPrimary: '#6366f1' } }, configDarkMode: 'light' })
  );
  expect(result.current.token).toEqual({ colorPrimary: '#6366f1' });
  expect(
    Array.isArray(result.current.algorithm) || typeof result.current.algorithm === 'function'
  ).toBe(true);
});

test('merges lightToken over shared token in light mode', () => {
  const { result } = renderHook(() =>
    useDarkMode({
      antd: {
        token: { colorPrimary: '#6366f1', colorBgLayout: '#ffffff' },
        lightToken: { colorBgLayout: '#fafafa' },
        darkToken: { colorBgLayout: '#0f1117' },
      },
      configDarkMode: 'light',
    })
  );
  expect(result.current.token).toEqual({
    colorPrimary: '#6366f1',
    colorBgLayout: '#fafafa',
  });
});

test('merges darkToken over shared token in dark mode', () => {
  const { result } = renderHook(() =>
    useDarkMode({
      antd: {
        token: { colorPrimary: '#6366f1' },
        lightToken: { colorBgLayout: '#fafafa' },
        darkToken: { colorBgLayout: '#0f1117', colorBgContainer: '#18181b' },
      },
      configDarkMode: 'dark',
    })
  );
  expect(result.current.token).toEqual({
    colorPrimary: '#6366f1',
    colorBgLayout: '#0f1117',
    colorBgContainer: '#18181b',
  });
});

test('returns undefined token when no tokens are configured', () => {
  const { result } = renderHook(() => useDarkMode({ antd: undefined, configDarkMode: 'light' }));
  expect(result.current.token).toBeUndefined();
  expect(result.current.components).toBeUndefined();
});

test('merges darkComponents over shared components in dark mode', () => {
  const { result } = renderHook(() =>
    useDarkMode({
      antd: {
        components: {
          Button: { borderRadius: 20 },
          Layout: { headerBg: '#fafafa' },
        },
        darkComponents: {
          Layout: { headerBg: '#0b1120', siderBg: '#0b1120' },
          Menu: { darkItemBg: '#0b1120' },
        },
      },
      configDarkMode: 'dark',
    })
  );
  expect(result.current.components).toEqual({
    Button: { borderRadius: 20 },
    Layout: { headerBg: '#0b1120', siderBg: '#0b1120' },
    Menu: { darkItemBg: '#0b1120' },
  });
});

test('merges lightComponents over shared components in light mode', () => {
  const { result } = renderHook(() =>
    useDarkMode({
      antd: {
        components: { Layout: { headerBg: '#ffffff', siderBg: '#ffffff' } },
        lightComponents: { Layout: { headerBg: '#fafafa' } },
      },
      configDarkMode: 'light',
    })
  );
  expect(result.current.components).toEqual({
    Layout: { headerBg: '#fafafa', siderBg: '#ffffff' },
  });
});

test('sets <html> background to darkToken.colorBgLayout in dark mode', () => {
  renderHook(() =>
    useDarkMode({
      antd: { darkToken: { colorBgLayout: '#0f1117' } },
      configDarkMode: 'dark',
    })
  );
  expect(document.documentElement.style.backgroundColor).toBe('rgb(15, 17, 23)');
});

test('falls back to #000 in dark mode when no darkToken is set', () => {
  renderHook(() => useDarkMode({ antd: {}, configDarkMode: 'dark' }));
  expect(document.documentElement.style.backgroundColor).toBe('rgb(0, 0, 0)');
});

test('sets <html> background to lightToken.colorBgLayout in light mode', () => {
  renderHook(() =>
    useDarkMode({
      antd: { lightToken: { colorBgLayout: '#fafafa' } },
      configDarkMode: 'light',
    })
  );
  expect(document.documentElement.style.backgroundColor).toBe('rgb(250, 250, 250)');
});

test('leaves <html> background unset when no lightToken.colorBgLayout is configured', () => {
  renderHook(() => useDarkMode({ antd: {}, configDarkMode: 'light' }));
  expect(document.documentElement.style.backgroundColor).toBe('');
});

test('exposes setDarkMode via window.__lowdefy_setDarkMode and toggles token/background', () => {
  const { result, rerender } = renderHook(() =>
    useDarkMode({
      antd: {
        token: { colorPrimary: '#6366f1' },
        lightToken: { colorBgLayout: '#fafafa' },
        darkToken: { colorBgLayout: '#0f1117' },
      },
      configDarkMode: 'system',
    })
  );

  // system + OS light → light mode
  expect(result.current.token.colorBgLayout).toBe('#fafafa');

  act(() => {
    window.__lowdefy_setDarkMode('dark');
  });
  rerender();

  expect(result.current.token.colorBgLayout).toBe('#0f1117');
  expect(document.documentElement.style.backgroundColor).toBe('rgb(15, 17, 23)');
});
