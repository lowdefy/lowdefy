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

import path_params from './path_params.js';

const pathParams = { space: 'support', ticket_id: '1234' };
const location = 'location';
// _path_params reads the values passed to it, never the URL.
const globals = { window: { location: { pathname: '/other/9', search: '?ticket_id=query' } } };

test('_path_params returns the value of a placeholder named by a string', () => {
  expect(
    path_params({ arrayIndices: [], globals, location, params: 'ticket_id', pathParams })
  ).toEqual('1234');
});

test('_path_params returns the value of a placeholder named by key', () => {
  expect(
    path_params({ arrayIndices: [], globals, location, params: { key: 'ticket_id' }, pathParams })
  ).toEqual('1234');
});

test('_path_params returns all values with all true', () => {
  expect(
    path_params({ arrayIndices: [], globals, location, params: { all: true }, pathParams })
  ).toEqual({ space: 'support', ticket_id: '1234' });
  expect(path_params({ arrayIndices: [], globals, location, params: true, pathParams })).toEqual({
    space: 'support',
    ticket_id: '1234',
  });
});

test('_path_params returns a copy, not the context values', () => {
  const all = path_params({ arrayIndices: [], globals, location, params: true, pathParams });
  all.space = 'changed';
  expect(pathParams.space).toEqual('support');
});

test('_path_params returns the default for a missing key', () => {
  expect(
    path_params({
      arrayIndices: [],
      globals,
      location,
      params: { key: 'missing', default: 'x' },
      pathParams,
    })
  ).toEqual('x');
  expect(
    path_params({ arrayIndices: [], globals, location, params: 'missing', pathParams })
  ).toEqual(null);
});

test('_path_params keeps a number-looking value a string', () => {
  const value = path_params({
    arrayIndices: [],
    globals,
    location,
    params: 'ticket_id',
    pathParams,
  });
  expect(typeof value).toEqual('string');
});

test('_path_params never reads the query string', () => {
  expect(
    path_params({ arrayIndices: [], globals, location, params: 'ticket_id', pathParams: {} })
  ).toEqual(null);
});

test('_path_params throws on invalid params', () => {
  expect(() =>
    path_params({ arrayIndices: [], globals, location, params: [], pathParams })
  ).toThrow('_path_params params must be of type string, integer, boolean or object.');
});
