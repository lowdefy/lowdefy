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
import { ServerParser } from '@lowdefy/operators';

import _credential from './credential.js';

test('_credential marks its value and returns it unchanged', () => {
  const markCredential = jest.fn();
  const value = { key: 'runtime-made-key-0001', secret: 'webhook-secret-0002' };
  expect(_credential({ markCredential, params: value })).toBe(value);
  expect(markCredential).toHaveBeenCalledWith(value);
});

test('_credential receives markCredential from the server parser', () => {
  const markCredential = jest.fn();
  const parser = new ServerParser({
    markCredential,
    operators: { _credential },
    secrets: {},
    user: {},
  });
  const { output, errors } = parser.parse({
    input: { key: { _credential: 'runtime-made-key-0001' } },
    location: 'locationId',
  });
  expect(errors).toEqual([]);
  expect(output).toEqual({ key: 'runtime-made-key-0001' });
  expect(markCredential).toHaveBeenCalledWith('runtime-made-key-0001');
});
