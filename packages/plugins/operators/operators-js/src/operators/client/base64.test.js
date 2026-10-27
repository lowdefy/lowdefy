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

import base64 from './base64.js';
import { expect, test } from 'vitest';

console.error = () => {};

test('_base64.decode a string', () => {
  expect(
    base64({ params: 'QSBzdHJpbmcgdmFsdWU=', location: 'locationId', methodName: 'decode' })
  ).toEqual('A string value');
});

test('_base64.decode a UTF-8 string', () => {
  expect(
    base64({ params: 'Y2Fmw6kg5pel5pys8J+Ygg==', location: 'locationId', methodName: 'decode' })
  ).toEqual('café 日本😂');
});

test('_base64.decode a base64url string without padding', () => {
  expect(base64({ params: 'PDw_Pz8-Pg', location: 'locationId', methodName: 'decode' })).toEqual(
    '<<???>>'
  );
  expect(
    base64({ params: 'Y2Fmw6kg5pel5pys8J-Ygg', location: 'locationId', methodName: 'decode' })
  ).toEqual('café 日本😂');
});

test('_base64.decode a string with leading or trailing whitespace', () => {
  expect(base64({ params: 'SGVsbG8=\n', location: 'locationId', methodName: 'decode' })).toEqual(
    'Hello'
  );
  expect(
    base64({ params: 'SGVsbG8gd29ybGQh\n', location: 'locationId', methodName: 'decode' })
  ).toEqual('Hello world!');
  expect(base64({ params: ' SGVsbG8= ', location: 'locationId', methodName: 'decode' })).toEqual(
    'Hello'
  );
});

test('_base64.decode throws when the decoded bytes are not valid UTF-8', () => {
  expect(() =>
    base64({ params: 'Y2Fm6Q==', location: 'locationId', methodName: 'decode' })
  ).toThrow('_base64.decode received base64 that does not decode to valid UTF-8 text.');
});

test('_base64.decode a number', () => {
  expect(() =>
    base64({ params: 10, location: 'locationId', methodName: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: _base64.decode accepts one of the following types: string.]`
  );
});

test('_base64.decode a boolean', () => {
  expect(() =>
    base64({ params: true, location: 'locationId', methodName: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: _base64.decode accepts one of the following types: string.]`
  );
});

test('_base64.decode a object', () => {
  expect(() =>
    base64({ params: { a: 1 }, location: 'locationId', methodName: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: _base64.decode accepts one of the following types: string.]`
  );
});

test('_base64.decode a array', () => {
  expect(() =>
    base64({ params: ['a', 'b'], location: 'locationId', methodName: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: _base64.decode accepts one of the following types: string.]`
  );
});

test('_base64.decode undefined', () => {
  expect(() =>
    base64({ location: 'locationId', methodName: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: _base64.decode accepts one of the following types: string.]`
  );
});

test('_base64.decode null', () => {
  expect(() =>
    base64({ params: null, location: 'locationId', methodName: 'decode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: _base64.decode accepts one of the following types: string.]`
  );
});

test('_base64.encode a string', () => {
  expect(
    base64({ params: 'A string value', location: 'locationId', methodName: 'encode' })
  ).toEqual('QSBzdHJpbmcgdmFsdWU=');
});

test('_base64.encode a UTF-8 string', () => {
  expect(base64({ params: 'café 日本😂', location: 'locationId', methodName: 'encode' })).toEqual(
    'Y2Fmw6kg5pel5pys8J+Ygg=='
  );
});

test('_base64.encode a number', () => {
  expect(() =>
    base64({ params: 10, location: 'locationId', methodName: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: _base64.encode accepts one of the following types: string.]`
  );
});

test('_base64.encode a boolean', () => {
  expect(() =>
    base64({ params: true, location: 'locationId', methodName: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: _base64.encode accepts one of the following types: string.]`
  );
});

test('_base64.encode a object', () => {
  expect(() =>
    base64({ params: { a: 1 }, location: 'locationId', methodName: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: _base64.encode accepts one of the following types: string.]`
  );
});

test('_base64.encode a array', () => {
  expect(() =>
    base64({ params: ['a', 'b'], location: 'locationId', methodName: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: _base64.encode accepts one of the following types: string.]`
  );
});

test('_base64.encode undefined', () => {
  expect(() =>
    base64({ location: 'locationId', methodName: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: _base64.encode accepts one of the following types: string.]`
  );
});

test('_base64.encode null', () => {
  expect(() =>
    base64({ params: null, location: 'locationId', methodName: 'encode' })
  ).toThrowErrorMatchingInlineSnapshot(
    `[Error: _base64.encode accepts one of the following types: string.]`
  );
});
