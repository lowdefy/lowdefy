/*
  Copyright 2020-2021 Lowdefy, Inc

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

import WebParser from '../../src/webParser';
import { context } from '../testContext';

const arrayIndices = [1];

console.error = () => {};

test('_operator, _state', async () => {
  const input = { a: { _operator: { name: '_state', params: 'string' } } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: 'state',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_operator.name invalid', async () => {
  const input = { a: { _operator: { name: '_a' } } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: null });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _operator - Invalid operator name. Received: {"name":"_a"} at locationId.],
    ]
  `);
});

test('_operator.name not allowed to include "experimental"', async () => {
  const input = { a: { _operator: { name: '_experimental_op' } } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: null });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: Experimental operators cannot be used with _operator. Received: {"name":"_experimental_op"} at locationId.],
    ]
  `);
});

test('_operator.name not a string', async () => {
  const input = { a: { _operator: { name: 1 } } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: null });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _operator.name must be a valid operator name as string. Received: {"name":1} at locationId.],
    ]
  `);
});

test('_operator with value not a object', async () => {
  const input = { a: { _operator: 'a' } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: null });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _operator.name must be a valid operator name as string. Received: "a" at locationId.],
    ]
  `);
});

test('_operator cannot be set to _operator', async () => {
  const input = { a: { _operator: { name: '_operator' } } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: null });
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _operator.name cannot be set to _operator to infinite avoid loop reference. Received: {"name":"_operator"} at locationId.],
    ]
  `);
});

test('_operator, _not with no params', async () => {
  const input = { a: { _operator: { name: '_not' } } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({ a: true });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_operator, _json.parse with params', async () => {
  const input = { a: { _operator: { name: '_json.parse', params: '[{ "a": "a1"}]' } } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: [{ a: 'a1' }],
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
