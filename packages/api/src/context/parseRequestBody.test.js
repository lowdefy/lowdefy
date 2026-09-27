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

import { UserError } from '@lowdefy/errors';

import parseRequestBody from './parseRequestBody.js';

test('parseRequestBody returns the parsed object', () => {
  expect(parseRequestBody({ text: '{"payload":{"a":1}}' })).toEqual({ payload: { a: 1 } });
});

test.each([
  ['text that is not JSON', 'nope', 'Request body is not valid JSON.'],
  ['an empty body', '', 'Request body is not valid JSON.'],
  ['JSON that is not an object', 'null', 'Request body must be a JSON object.'],
])('parseRequestBody throws a UserError for %s', (_, text, message) => {
  expect(() => parseRequestBody({ text })).toThrow(UserError);
  expect(() => parseRequestBody({ text })).toThrow(message);
});
