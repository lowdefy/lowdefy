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

import validateViewport from './validateViewport.js';

test('validateViewport accepts no options and every valid option', () => {
  expect(validateViewport({})).toBeUndefined();
  expect(validateViewport({ width: 390, height: 844, colorScheme: 'dark' })).toBeUndefined();
  expect(validateViewport({ colorScheme: 'light' })).toBeUndefined();
});

test.each([
  [{ width: 0 }, 'Viewport width must be a positive integer (CSS pixels). Received 0.'],
  [{ width: 390.5 }, 'Viewport width must be a positive integer (CSS pixels). Received 390.5.'],
  [{ height: -1 }, 'Viewport height must be a positive integer (CSS pixels). Received -1.'],
  [{ height: '800' }, 'Viewport height must be a positive integer (CSS pixels). Received "800".'],
  [{ colorScheme: 'dim' }, 'Color scheme must be "light" or "dark". Received "dim".'],
])('validateViewport rejects %j', (options, message) => {
  expect(validateViewport(options)).toEqual(message);
});
