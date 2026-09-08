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

import resolveThemeLogo from './resolveThemeLogo.js';

test('resolveThemeLogo resolves a relative logo against serverUrl', () => {
  expect(
    resolveThemeLogo({ theme: { logo: '/logo.png' }, serverUrl: 'https://myapp.com', basePath: '' })
  ).toEqual({ logo: 'https://myapp.com/logo.png' });
});

test('resolveThemeLogo includes basePath when resolving a relative logo', () => {
  expect(
    resolveThemeLogo({
      theme: { logo: '/logo.png' },
      serverUrl: 'https://myapp.com',
      basePath: '/base',
    })
  ).toEqual({ logo: 'https://myapp.com/base/logo.png' });
});

test('resolveThemeLogo passes an absolute logo through unchanged', () => {
  const theme = { logo: 'https://cdn.example.com/logo.png' };
  expect(resolveThemeLogo({ theme, serverUrl: 'https://myapp.com', basePath: '' })).toBe(theme);
});

test('resolveThemeLogo passes a protocol-relative logo through unchanged', () => {
  const theme = { logo: '//cdn.example.com/logo.png' };
  expect(resolveThemeLogo({ theme, serverUrl: 'https://myapp.com', basePath: '' })).toBe(theme);
});

test('resolveThemeLogo passes non-string and missing logos through unchanged', () => {
  const noLogo = { companyName: 'MyApp' };
  expect(resolveThemeLogo({ theme: noLogo, serverUrl: 'https://myapp.com', basePath: '' })).toBe(
    noLogo
  );
  const numberLogo = { logo: 7 };
  expect(
    resolveThemeLogo({ theme: numberLogo, serverUrl: 'https://myapp.com', basePath: '' })
  ).toBe(numberLogo);
});

test('resolveThemeLogo drops a relative logo when serverUrl is none', () => {
  expect(
    resolveThemeLogo({
      theme: { logo: '/logo.png', companyName: 'MyApp' },
      serverUrl: undefined,
      basePath: '',
    })
  ).toEqual({ companyName: 'MyApp' });
  expect(resolveThemeLogo({ theme: { logo: '/logo.png' }, serverUrl: null, basePath: '' })).toEqual(
    {}
  );
});

test('resolveThemeLogo preserves other theme fields when resolving', () => {
  expect(
    resolveThemeLogo({
      theme: { logo: '/logo.png', companyName: 'MyApp', primaryColor: '#c9a84c' },
      serverUrl: 'https://myapp.com',
      basePath: '',
    })
  ).toEqual({
    logo: 'https://myapp.com/logo.png',
    companyName: 'MyApp',
    primaryColor: '#c9a84c',
  });
});
