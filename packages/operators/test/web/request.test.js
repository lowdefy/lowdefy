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

test('_request by id', async () => {
  const input = { a: { _request: 'string' } };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: 'request String',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request true gives null', async () => {
  const input = { _request: true };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _request accepts a string value. Received: true at locationId.],
    ]
  `);
});

test('_request return full array', async () => {
  const input = { _request: 'arr' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([{ a: 'request a1' }, { a: 'request a2' }]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request return number', async () => {
  const input = { _request: 'number' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(500);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request null', async () => {
  const input = { _request: null };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _request accepts a string value. Received: null at locationId.],
    ]
  `);
});

test('_request loading true', async () => {
  const input = { _request: 'not_loaded' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request dot notation', async () => {
  const input = { _request: 'arr.0.a' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('request a1');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request dot notation with arrayindices', async () => {
  const input = { _request: 'arr.$.a' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual('request a2');
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request dot notation returns null if ', async () => {
  const input = { _request: 'returnsNull.key' };
  const parser = new WebParser({ context });
  await parser.init();
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
