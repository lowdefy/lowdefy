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
  expect(resolveDevAuthUrl({ configured: 'http://localhost:3000', port: 4102 })).toEqual(
    'http://localhost:4102'
  );
});

test('a localhost origin with no port follows the dev server port', () => {
  expect(resolveDevAuthUrl({ configured: 'http://localhost', port: 3001 })).toEqual(
    'http://localhost:3001'
  );
});

test('127.0.0.1 and [::1] origins follow the dev server port', () => {
  expect(resolveDevAuthUrl({ configured: 'http://127.0.0.1:3000', port: 4102 })).toEqual(
    'http://127.0.0.1:4102'
  );
  expect(resolveDevAuthUrl({ configured: 'http://[::1]:3000', port: 4102 })).toEqual(
    'http://[::1]:4102'
  );
});

test('a path on the configured origin is kept', () => {
  expect(resolveDevAuthUrl({ configured: 'http://localhost:3000/app', port: 4102 })).toEqual(
    'http://localhost:4102/app'
  );
});

test('a localhost origin already on the dev server port is returned as configured', () => {
  expect(resolveDevAuthUrl({ configured: 'http://localhost:4102', port: 4102 })).toEqual(
    'http://localhost:4102'
  );
});

test('a non-loopback origin is kept', () => {
  expect(resolveDevAuthUrl({ configured: 'https://dev.example.ngrok.app', port: 4102 })).toEqual(
    'https://dev.example.ngrok.app'
  );
  expect(resolveDevAuthUrl({ configured: 'http://192.168.1.20:3000', port: 4102 })).toEqual(
    'http://192.168.1.20:3000'
  );
});

test('an unset origin stays unset', () => {
  expect(resolveDevAuthUrl({ configured: undefined, port: 4102 })).toBeUndefined();
  expect(resolveDevAuthUrl({ configured: '', port: 4102 })).toEqual('');
});

test('an unparseable value is returned as configured', () => {
  expect(resolveDevAuthUrl({ configured: 'localhost:3000', port: 4102 })).toEqual('localhost:3000');
});
