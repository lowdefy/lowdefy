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

import resolveDevAuthUrl from './resolveDevAuthUrl.mjs';

test('a localhost origin on another port follows the dev server port', () => {
  expect(resolveDevAuthUrl({ configured: 'http://localhost:3000', port: 4102 })).toEqual({
    authUrl: 'http://localhost:4102',
    rewritten: true,
  });
});

test('127.0.0.1 and [::1] origins follow the dev server port', () => {
  expect(resolveDevAuthUrl({ configured: 'http://127.0.0.1:3000', port: 4102 })).toEqual({
    authUrl: 'http://127.0.0.1:4102',
    rewritten: true,
  });
  expect(resolveDevAuthUrl({ configured: 'http://[::1]:3000', port: 4102 })).toEqual({
    authUrl: 'http://[::1]:4102',
    rewritten: true,
  });
});

test('a path on the configured origin is kept', () => {
  expect(resolveDevAuthUrl({ configured: 'http://localhost:3000/app', port: 4102 })).toEqual({
    authUrl: 'http://localhost:4102/app',
    rewritten: true,
  });
});

test('a localhost origin already on the dev server port is returned as configured', () => {
  expect(resolveDevAuthUrl({ configured: 'http://localhost:4102', port: 4102 })).toEqual({
    authUrl: 'http://localhost:4102',
    rewritten: false,
  });
});

test('surrounding whitespace is trimmed without counting as a rewrite', () => {
  expect(resolveDevAuthUrl({ configured: 'http://localhost:4102 ', port: 4102 })).toEqual({
    authUrl: 'http://localhost:4102',
    rewritten: false,
  });
});

test('an https localhost origin is kept, since a local TLS proxy fronts the dev server', () => {
  expect(resolveDevAuthUrl({ configured: 'https://localhost', port: 4102 })).toEqual({
    authUrl: 'https://localhost',
    rewritten: false,
  });
  expect(resolveDevAuthUrl({ configured: 'https://localhost:8443', port: 4102 })).toEqual({
    authUrl: 'https://localhost:8443',
    rewritten: false,
  });
});

test('a localhost origin on the default port is kept, since a local proxy fronts the dev server', () => {
  expect(resolveDevAuthUrl({ configured: 'http://localhost', port: 4102 })).toEqual({
    authUrl: 'http://localhost',
    rewritten: false,
  });
  expect(resolveDevAuthUrl({ configured: 'http://localhost:80', port: 4102 })).toEqual({
    authUrl: 'http://localhost:80',
    rewritten: false,
  });
});

test('a non-loopback origin is kept', () => {
  expect(resolveDevAuthUrl({ configured: 'https://dev.example.ngrok.app', port: 4102 })).toEqual({
    authUrl: 'https://dev.example.ngrok.app',
    rewritten: false,
  });
  expect(resolveDevAuthUrl({ configured: 'http://192.168.1.20:3000', port: 4102 })).toEqual({
    authUrl: 'http://192.168.1.20:3000',
    rewritten: false,
  });
});

test('an unset origin stays unset', () => {
  expect(resolveDevAuthUrl({ configured: undefined, port: 4102 })).toEqual({
    authUrl: undefined,
    rewritten: false,
  });
  expect(resolveDevAuthUrl({ configured: '', port: 4102 })).toEqual({
    authUrl: '',
    rewritten: false,
  });
});

test('an unparseable value is returned as configured', () => {
  expect(resolveDevAuthUrl({ configured: 'localhost:3000', port: 4102 })).toEqual({
    authUrl: 'localhost:3000',
    rewritten: false,
  });
});
