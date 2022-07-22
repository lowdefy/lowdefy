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

import uri from './uri.js';

test('_uri.decode strings', () => {
  expect(
    uri({
      params: '%3B%2C%2F%3F%3A%40%26%3D%2B%24',
      methodName: 'decode',
    })
  ).toEqual(';,/?:@&=+$');
  expect(uri({ params: "-_.!~*'()", methodName: 'decode' })).toEqual("-_.!~*'()");
  expect(uri({ params: '%23', methodName: 'decode' })).toEqual('#');
  expect(uri({ params: 'ABC%20abc%20123', methodName: 'decode' })).toEqual('ABC abc 123');
});

test('_uri.decode a number', () => {
  expect(() => uri({ params: 10, methodName: 'decode' })).toThrowErrorMatchingInlineSnapshot(
    `"_uri.decode accepts one of the following types: string."`
  );
});

test('_uri.decode a boolean', () => {
  expect(() => uri({ params: true, methodName: 'decode' })).toThrowErrorMatchingInlineSnapshot(
    `"_uri.decode accepts one of the following types: string."`
  );
});

test('_uri.decode a object', () => {
  expect(() => uri({ params: { a: 1 }, methodName: 'decode' })).toThrowErrorMatchingInlineSnapshot(
    `"_uri.decode accepts one of the following types: string."`
  );
});

test('_uri.decode a array', () => {
  expect(() =>
    uri({ params: ['a', 'b'], methodName: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(`"_uri.decode accepts one of the following types: string."`);
});

test('_uri.decode undefined', () => {
  expect(() => uri({ params: undefined, methodName: 'decode' })).toThrowErrorMatchingInlineSnapshot(
    `"_uri.decode accepts one of the following types: string."`
  );
});

test('_uri.decode null', () => {
  expect(() => uri({ params: null, methodName: 'decode' })).toThrowErrorMatchingInlineSnapshot(
    `"_uri.decode accepts one of the following types: string."`
  );
});

test('_uri.encode strings', () => {
  expect(uri({ params: ';,/?:@&=+$', methodName: 'encode' })).toEqual(
    '%3B%2C%2F%3F%3A%40%26%3D%2B%24'
  );
  expect(uri({ params: "-_.!~*'()", methodName: 'encode' })).toEqual("-_.!~*'()");
  expect(uri({ params: '#', methodName: 'encode' })).toEqual('%23');
  expect(uri({ params: 'ABC abc 123', methodName: 'encode' })).toEqual('ABC%20abc%20123');
});

test('_uri.encode a number', () => {
  expect(() => uri({ params: 10, methodName: 'encode' })).toThrowErrorMatchingInlineSnapshot(
    `"_uri.encode accepts one of the following types: string."`
  );
});

test('_uri.encode a boolean', () => {
  expect(() => uri({ params: true, methodName: 'encode' })).toThrowErrorMatchingInlineSnapshot(
    `"_uri.encode accepts one of the following types: string."`
  );
});

test('_uri.encode a object', () => {
  expect(() => uri({ params: { a: 1 }, methodName: 'encode' })).toThrowErrorMatchingInlineSnapshot(
    `"_uri.encode accepts one of the following types: string."`
  );
});

test('_uri.encode a array', () => {
  expect(() =>
    uri({ params: ['a', 'b'], methodName: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(`"_uri.encode accepts one of the following types: string."`);
});

test('_uri.encode undefined', () => {
  expect(() => uri({ params: undefined, methodName: 'encode' })).toThrowErrorMatchingInlineSnapshot(
    `"_uri.encode accepts one of the following types: string."`
  );
});

test('_uri.encode null', () => {
  expect(() => uri({ params: null, methodName: 'encode' })).toThrowErrorMatchingInlineSnapshot(
    `"_uri.encode accepts one of the following types: string."`
  );
});
