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

test('urlQuery parse returns string values for non-serialized params', () => {
  expect(urlQuery.parse('a=1&b=2')).toEqual({ a: 1, b: 2 });
  expect(urlQuery.parse('a=x&b=y')).toEqual({ a: 'x', b: 'y' });
});

test('urlQuery parse skips a __proto__ key and does not pollute Object.prototype', () => {
  const parsed = urlQuery.parse('__proto__=polluted');
  expect(parsed).toEqual({});
  expect(Object.keys(parsed)).toEqual([]);
  expect(parsed.polluted).toBeUndefined();
  expect({}.polluted).toBeUndefined();
  expect(Object.prototype.polluted).toBeUndefined();
});

test('urlQuery parse skips a nested __proto__ payload without polluting Object.prototype', () => {
  const parsed = urlQuery.parse(`__proto__=${encodeURIComponent('{"polluted":true}')}`);
  expect(parsed).toEqual({});
  expect({}.polluted).toBeUndefined();
  expect(Object.prototype.polluted).toBeUndefined();
});

test('urlQuery parse keeps non-reserved keys when a reserved key is present', () => {
  expect(urlQuery.parse('a=1&__proto__=polluted&b=2')).toEqual({ a: 1, b: 2 });
  expect({}.polluted).toBeUndefined();
});

test('urlQuery parse skips all reserved keys', () => {
  expect(urlQuery.parse('constructor=x&prototype=y&__defineGetter__=z')).toEqual({});
  expect(
    urlQuery.parse('__defineSetter__=a&__lookupGetter__=b&__lookupSetter__=c&__proto__=d')
  ).toEqual({});
});

test('urlQuery parse does not block non-reserved Object.prototype method names', () => {
  expect(urlQuery.parse('hasOwnProperty=x')).toEqual({ hasOwnProperty: 'x' });
  expect(urlQuery.parse('toString=x&valueOf=y')).toEqual({ toString: 'x', valueOf: 'y' });
});

test('urlQuery parse returns a plain object supporting Object.prototype methods', () => {
  const parsed = urlQuery.parse('a=1');
  expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  // Calling through the instance is the assertion: D4 keeps the result map a plain object so
  // callers can still use Object.prototype methods on it, which a null-proto map would break.
  // eslint-disable-next-line no-prototype-builtins
  expect(parsed.hasOwnProperty('a')).toBe(true);
});
