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

import parseUserParam from './parseUserParam.js';

test('parseUserParam returns nothing when the param is absent', () => {
  expect(parseUserParam({ value: undefined })).toEqual({});
});

test('parseUserParam parses a JSON string from a query param', () => {
  expect(parseUserParam({ value: '{"roles":["admin"]}' })).toEqual({
    user: { roles: ['admin'] },
  });
});

test('parseUserParam passes an object from a JSON body through', () => {
  expect(parseUserParam({ value: { roles: ['admin'] } })).toEqual({
    user: { roles: ['admin'] },
  });
});

test('parseUserParam returns an error when the query param is not JSON', () => {
  expect(parseUserParam({ value: 'admin' }).error).toMatch(/must be JSON/);
});

test('parseUserParam returns an error when the param parses to a non-object', () => {
  expect(parseUserParam({ value: '["admin"]' }).error).toMatch(/must be an object/);
});

test('parseUserParam returns an error when a body value is not an object', () => {
  expect(parseUserParam({ value: 42 }).error).toMatch(/must be an object/);
});
