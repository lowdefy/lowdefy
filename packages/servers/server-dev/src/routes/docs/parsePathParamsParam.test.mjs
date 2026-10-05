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

import parsePathParamsParam from './parsePathParamsParam.js';

test('parsePathParamsParam returns nothing when the param is absent', () => {
  expect(parsePathParamsParam({ value: undefined })).toEqual({});
  expect(parsePathParamsParam({ value: null })).toEqual({});
});

test('parsePathParamsParam parses a JSON string from a query param', () => {
  expect(parsePathParamsParam({ value: '{"space":"s","ticket_id":"1"}' })).toEqual({
    pathParams: { space: 's', ticket_id: '1' },
  });
});

test('parsePathParamsParam passes an object from a JSON body through', () => {
  expect(parsePathParamsParam({ value: { ticket_id: 1 } })).toEqual({
    pathParams: { ticket_id: 1 },
  });
});

test('parsePathParamsParam returns an error when the query param is not JSON', () => {
  expect(parsePathParamsParam({ value: 'ticket_id=1' }).error).toMatch(/must be JSON/);
});

test('parsePathParamsParam leaves a parsed non-object for the page tools to refuse', () => {
  expect(parsePathParamsParam({ value: '["1"]' })).toEqual({ pathParams: ['1'] });
});
