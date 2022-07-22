/*
  Copyright 2020-2022 Lowdefy, Inc

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

import _request from './request.js';

const arrayIndices = [1];
const requests = {
  arr: [
    {
      response: [{ a: 'request a1' }, { a: 'request a2' }],
      loading: false,
      error: [],
    },
  ],
  number: [
    {
      response: 500,
      loading: false,
      error: [],
    },
  ],
  string: [
    {
      response: 'request String',
      loading: false,
      error: [],
    },
  ],
};

test('_request by id', () => {
  expect(_request({ params: 'string', requests, arrayIndices })).toEqual('request String');
});

test('_request true gives null', () => {
  expect(() => {
    _request({ params: true, requests, arrayIndices });
  }).toThrow('_request accepts a string value.');
});

test('_request return full array', () => {
  expect(_request({ params: 'arr', requests, arrayIndices })).toEqual([
    { a: 'request a1' },
    { a: 'request a2' },
  ]);
});

test('_request return number', () => {
  expect(_request({ params: 'number', requests, arrayIndices })).toEqual(500);
});

test('_request null', () => {
  expect(() => {
    _request({ params: null, requests, arrayIndices });
  }).toThrow('_request accepts a string value.');
});

test('_request loading true', () => {
  expect(_request({ params: 'not_loaded', requests, arrayIndices })).toEqual(null);
});

test('_request dot notation', () => {
  expect(_request({ params: 'arr.0.a', requests, arrayIndices })).toEqual('request a1');
});

test('_request dot notation with arrayindices', () => {
  expect(_request({ params: 'arr.$.a', requests, arrayIndices })).toEqual('request a2');
});

test('_request dot notation returns null if ', () => {
  expect(_request({ params: 'returnsNull.key', requests, arrayIndices })).toEqual(null);
});
