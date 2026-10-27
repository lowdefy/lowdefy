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

import createResolveUrl from './createResolveUrl.js';

const resolveUrl = createResolveUrl({ apiBase: 'https://field.example.com' });

test('a path from the root is taken on the app server origin', () => {
  expect(resolveUrl('/public/logo.png')).toBe('https://field.example.com/public/logo.png');
});

test('a path from the root drops the path of an app served under one', () => {
  const underPath = createResolveUrl({ apiBase: 'https://example.com/crm' });
  expect(underPath('/crm/logo.png')).toBe('https://example.com/crm/logo.png');
  expect(underPath('logo.png')).toBe('https://example.com/crm/logo.png');
});

test('a relative path is taken under the app server url', () => {
  expect(resolveUrl('images/a.png')).toBe('https://field.example.com/images/a.png');
});

test('a url from // takes the app server scheme', () => {
  expect(resolveUrl('//cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
});

test('a url with a scheme is left as it is', () => {
  expect(resolveUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
  expect(resolveUrl('mailto:ops@example.com')).toBe('mailto:ops@example.com');
  expect(resolveUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
});

test('apiBase is read when a url is resolved', () => {
  const lowdefy = {};
  const lateResolve = createResolveUrl(lowdefy);
  expect(lateResolve('/a.png')).toBe('/a.png');
  lowdefy.apiBase = 'http://192.168.1.10:3000';
  expect(lateResolve('/a.png')).toBe('http://192.168.1.10:3000/a.png');
});

test('an empty or missing url is returned as it is', () => {
  expect(resolveUrl('')).toBe('');
  expect(resolveUrl(undefined)).toBe(undefined);
});

test('a relative path drops the trailing slashes of the app server url', () => {
  const trailing = createResolveUrl({ apiBase: 'https://example.com/crm//' });
  expect(trailing('logo.png')).toBe('https://example.com/crm/logo.png');
});

test('a relative path is resolved under an app server url with a long run of slashes without backtracking', () => {
  const slashes = createResolveUrl({ apiBase: `https://example.com/a${'/'.repeat(100000)}b` });
  const start = performance.now();
  expect(slashes('c.png')).toBe(`https://example.com/a${'/'.repeat(100000)}b/c.png`);
  expect(performance.now() - start).toBeLessThan(1000);
});
