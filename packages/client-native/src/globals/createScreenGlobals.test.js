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

import createNativeGlobals from './createNativeGlobals.js';
import createScreenGlobals from './createScreenGlobals.js';

test('screen globals read their own route and keep the app window and services', () => {
  const app = { path: '/m-designs' };
  const globals = {
    ...createNativeGlobals({
      assign: jest.fn(),
      fetch: jest.fn(),
      getPath: () => app.path,
      origin: 'https://app.lowdefy.test',
    }),
    storage: { get: jest.fn() },
  };
  const screen = createScreenGlobals({
    globals,
    getPath: () => '/m-design?space=ACME&key=ACME-645',
  });
  expect(screen.window.location.pathname).toEqual('/m-design');
  expect(screen.window.location.search).toEqual('?space=ACME&key=ACME-645');
  expect(screen.window.location.href).toEqual(
    'https://app.lowdefy.test/m-design?space=ACME&key=ACME-645'
  );
  expect(globals.window.location.search).toEqual('');
  expect(screen.window.innerWidth).toEqual(globals.window.innerWidth);
  expect(screen.window.addEventListener).toBe(globals.window.addEventListener);
  expect(screen.storage).toBe(globals.storage);
  expect(screen.elements).toBe(globals.elements);
  expect(screen.fetch).toBe(globals.fetch);
});
