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

import createImageSource from './createImageSource.js';

function createLowdefy({ apiBase = 'https://app.test', authTransport = 'bearer', token = 'tok' }) {
  return {
    apiBase,
    _internal: { host: { authTransport, tokenStore: { get: () => token } } },
  };
}

const bearer = { Authorization: 'Bearer tok' };

test('an image on the app server origin carries the bearer token', () => {
  const imageSource = createImageSource(createLowdefy({}));
  expect(imageSource('/public/logo.png')).toEqual({
    headers: bearer,
    uri: 'https://app.test/public/logo.png',
  });
  expect(imageSource('https://app.test/avatars/ada.png')).toEqual({
    headers: bearer,
    uri: 'https://app.test/avatars/ada.png',
  });
});

test('the origin is compared without case', () => {
  const imageSource = createImageSource(createLowdefy({}));
  expect(imageSource('HTTPS://App.Test/a.png').headers).toEqual(bearer);
});

test('an image on another origin carries no token', () => {
  const imageSource = createImageSource(createLowdefy({}));
  expect(imageSource('https://cdn.example.com/a.png')).toEqual({
    uri: 'https://cdn.example.com/a.png',
  });
  expect(imageSource('//cdn.example.com/a.png')).toEqual({ uri: 'https://cdn.example.com/a.png' });
  expect(imageSource('http://app.test/a.png')).toEqual({ uri: 'http://app.test/a.png' });
  expect(imageSource('https://app.test:8443/a.png')).toEqual({
    uri: 'https://app.test:8443/a.png',
  });
});

test('a lookalike host carries no token', () => {
  const imageSource = createImageSource(createLowdefy({}));
  expect(imageSource('https://app.test.evil.com/a.png')).toEqual({
    uri: 'https://app.test.evil.com/a.png',
  });
  expect(imageSource('https://app.test@evil.com/a.png')).toEqual({
    uri: 'https://app.test@evil.com/a.png',
  });
  expect(imageSource('https://evil-app.test/a.png')).toEqual({
    uri: 'https://evil-app.test/a.png',
  });
});

test('an app server under a path compares its origin only', () => {
  const imageSource = createImageSource(createLowdefy({ apiBase: 'https://app.test/crm' }));
  expect(imageSource('logo.png')).toEqual({
    headers: bearer,
    uri: 'https://app.test/crm/logo.png',
  });
});

test('no token, or a cookie host, carries no header', () => {
  const noToken = createImageSource(createLowdefy({ token: null }));
  expect(noToken('/a.png')).toEqual({ uri: 'https://app.test/a.png' });
  const cookie = createImageSource(createLowdefy({ authTransport: 'cookie' }));
  expect(cookie('/a.png')).toEqual({ uri: 'https://app.test/a.png' });
});

test('a data uri carries no token', () => {
  const imageSource = createImageSource(createLowdefy({}));
  expect(imageSource('data:image/png;base64,AAAA')).toEqual({ uri: 'data:image/png;base64,AAAA' });
});

test('no apiBase leaves a path as it is, with no token', () => {
  const imageSource = createImageSource(createLowdefy({ apiBase: null }));
  expect(imageSource('/a.png')).toEqual({ uri: '/a.png' });
});

test('apiBase and the token are read when a source is made', () => {
  const lowdefy = createLowdefy({ apiBase: null });
  const imageSource = createImageSource(lowdefy);
  expect(imageSource('/a.png')).toEqual({ uri: '/a.png' });
  lowdefy.apiBase = 'https://app.test';
  let token = null;
  lowdefy._internal.host.tokenStore.get = () => token;
  expect(imageSource('/a.png')).toEqual({ uri: 'https://app.test/a.png' });
  token = 'later';
  expect(imageSource('/a.png')).toEqual({
    headers: { Authorization: 'Bearer later' },
    uri: 'https://app.test/a.png',
  });
});
