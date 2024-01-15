/*
  Copyright 2020-2024 Lowdefy, Inc

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

import urlQuery from './urlQuery.js';

test('primitives', () => {
  expect(urlQuery.stringify(1)).toEqual('');
  expect(urlQuery.stringify('a')).toEqual('');
});

test('primitives in object', () => {
  const string = urlQuery.stringify({
    a: 1,
    b: 'b',
  });
  expect(string).toEqual('a=1&b=b');
  expect(urlQuery.parse(string)).toEqual({
    a: 1,
    b: 'b',
  });
});

test('primitive in array', () => {
  expect(urlQuery.stringify([1, 2, 3])).toEqual('');
});

test('array in object', () => {
  const string = urlQuery.stringify({
    arr: [1, 2, 3],
  });
  expect(string).toEqual('arr=%5B1%2C2%2C3%5D');
  expect(urlQuery.parse(string)).toEqual({
    arr: [1, 2, 3],
  });
});

test('object in object', () => {
  const string = urlQuery.stringify({
    a: {
      b: '1',
    },
  });
  expect(string).toEqual('a=%7B%22b%22%3A%221%22%7D');
  expect(urlQuery.parse(string)).toEqual({
    a: {
      b: '1',
    },
  });
});

test('object in array', () => {
  const string = urlQuery.stringify({
    arr: [
      {
        a: '0',
      },

      {
        b: '1',
      },
    ],
  });
  expect(string).toEqual('arr=%5B%7B%22a%22%3A%220%22%7D%2C%7B%22b%22%3A%221%22%7D%5D');
  expect(urlQuery.parse(string)).toEqual({
    arr: [
      {
        a: '0',
      },

      {
        b: '1',
      },
    ],
  });
});

test('array in array', () => {
  const string = urlQuery.stringify({
    arr: [
      [1, 2],
      [3, 4],
    ],
  });
  expect(string).toEqual('arr=%5B%5B1%2C2%5D%2C%5B3%2C4%5D%5D');
  expect(urlQuery.parse(string)).toEqual({
    arr: [
      [1, 2],
      [3, 4],
    ],
  });
});

test('object, primitive and array in object', () => {
  const string = urlQuery.stringify({
    a: 'a',
    arr: [1, 2],
    obj: {
      b: '1',
    },
  });
  expect(string).toEqual('a=a&arr=%5B1%2C2%5D&obj=%7B%22b%22%3A%221%22%7D');
  expect(urlQuery.parse(string)).toEqual({
    a: 'a',
    arr: [1, 2],
    obj: {
      b: '1',
    },
  });
});

test('urlQuery parse string starts with ?', () => {
  const string = '?a=a&arr=%5B1%2C2%5D&obj=%7B%22b%22%3A%221%22%7D';
  expect(urlQuery.parse(string)).toEqual({
    a: 'a',
    obj: {
      b: '1',
    },
    arr: [1, 2],
  });
});

test('urlQuery parse string with params not serialized JSON', () => {
  const string = 'a=a&b=1';
  expect(urlQuery.parse(string)).toEqual({
    a: 'a',
    b: 1,
  });
});
