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

import resolveMockUser from './resolveMockUser.js';

test('resolveMockUser returns a default roleless user for the bare flag', () => {
  expect(JSON.parse(resolveMockUser(true))).toEqual({
    sub: 'lowdefy-dev',
    id: 'lowdefy-dev',
    name: 'Lowdefy Dev User',
    roles: [],
  });
});

test('resolveMockUser normalizes a valid JSON user string', () => {
  expect(resolveMockUser('{ "sub": "dev", "roles": ["admin"] }')).toEqual(
    '{"sub":"dev","roles":["admin"]}'
  );
});

test('resolveMockUser throws on invalid JSON', () => {
  expect(() => resolveMockUser('not json')).toThrow(
    'Invalid --mock-user value. Expected a JSON user object, received "not json".'
  );
});
