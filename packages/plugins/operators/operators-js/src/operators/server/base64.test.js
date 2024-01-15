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

import base64 from './base64.js';

console.error = () => {};

test('_base64.decode a string', () => {
  expect(
    base64({ params: 'QSBzdHJpbmcgdmFsdWU=', location: 'locationId', methodName: 'decode' })
  ).toEqual('A string value');
});

test('_base64.decode a number', () => {
  expect(() => base64({ params: 10, location: 'locationId', methodName: 'decode' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _base64.decode accepts one of the following types: string.
          Received: {\\"_base64.decode\\":10} at locationId."
  `);
});

test('_base64.decode a boolean', () => {
  expect(() => base64({ params: true, location: 'locationId', methodName: 'decode' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _base64.decode accepts one of the following types: string.
          Received: {\\"_base64.decode\\":true} at locationId."
  `);
});

test('_base64.decode a object', () => {
  expect(() => base64({ params: { a: 1 }, location: 'locationId', methodName: 'decode' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _base64.decode accepts one of the following types: string.
          Received: {\\"_base64.decode\\":{\\"a\\":1}} at locationId."
  `);
});

test('_base64.decode a array', () => {
  expect(() => base64({ params: ['a', 'b'], location: 'locationId', methodName: 'decode' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _base64.decode accepts one of the following types: string.
          Received: {\\"_base64.decode\\":[\\"a\\",\\"b\\"]} at locationId."
  `);
});

test('_base64.decode undefined', () => {
  expect(() => base64({ location: 'locationId', methodName: 'decode' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _base64.decode accepts one of the following types: string.
          Received: {\\"_base64.decode\\":undefined} at locationId."
  `);
});

test('_base64.decode null', () => {
  expect(() => base64({ params: null, location: 'locationId', methodName: 'decode' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _base64.decode accepts one of the following types: string.
          Received: {\\"_base64.decode\\":null} at locationId."
  `);
});

test('_base64.encode a string', () => {
  expect(
    base64({ params: 'A string value', location: 'locationId', methodName: 'encode' })
  ).toEqual('QSBzdHJpbmcgdmFsdWU=');
});

test('_base64.encode a number', () => {
  expect(() => base64({ params: 10, location: 'locationId', methodName: 'encode' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _base64.encode accepts one of the following types: string.
          Received: {\\"_base64.encode\\":10} at locationId."
  `);
});

test('_base64.encode a boolean', () => {
  expect(() => base64({ params: true, location: 'locationId', methodName: 'encode' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _base64.encode accepts one of the following types: string.
          Received: {\\"_base64.encode\\":true} at locationId."
  `);
});

test('_base64.encode a object', () => {
  expect(() => base64({ params: { a: 1 }, location: 'locationId', methodName: 'encode' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _base64.encode accepts one of the following types: string.
          Received: {\\"_base64.encode\\":{\\"a\\":1}} at locationId."
  `);
});

test('_base64.encode a array', () => {
  expect(() => base64({ params: ['a', 'b'], location: 'locationId', methodName: 'encode' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _base64.encode accepts one of the following types: string.
          Received: {\\"_base64.encode\\":[\\"a\\",\\"b\\"]} at locationId."
  `);
});

test('_base64.encode undefined', () => {
  expect(() => base64({ location: 'locationId', methodName: 'encode' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _base64.encode accepts one of the following types: string.
          Received: {\\"_base64.encode\\":undefined} at locationId."
  `);
});

test('_base64.encode null', () => {
  expect(() => base64({ params: null, location: 'locationId', methodName: 'encode' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _base64.encode accepts one of the following types: string.
          Received: {\\"_base64.encode\\":null} at locationId."
  `);
});
