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

const lowdefy = {
  inputs: {
    own: {
      string: 'input',
      arr: [{ a: 'input1' }, { a: 'input2' }],
    },
  },
  lowdefyGlobal: {
    string: 'global',
    arr: [{ a: 'global1' }, { a: 'global2' }],
  },
  menus: [
    {
      menuId: 'default',
    },
    {
      menuId: 'm_1',
    },
    {
      menuId: 'm_2',
    },
  ],
  urlQuery: {
    string: 'urlQuery',
    arr: [{ a: 'urlQuery1' }, { a: 'urlQuery2' }],
  },
};

const context = {
  config: {
    string: 'config',
    arr: [{ a: 'config1' }, { a: 'config2' }],
  },
  requests: {
    not_loaded: { loading: true, response: 'fail' },
    string: { loading: false, response: 'request String' },
    number: { loading: false, response: 500 },
    arr: { loading: false, response: [{ a: 'request a1' }, { a: 'request a2' }] },
  },
  lowdefy,
  state: {
    string: 'state',
    arr: [{ a: 'state1' }, { a: 'state2' }],
  },
};

const contexts = {};

const arrayIndices = [1];

console.error = () => {};

test('_request by id', () => {
  const input = { a: { _request: 'string' } };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual({
    a: 'request String',
  });
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request true gives null', () => {
  const input = { _request: true };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _request accepts a string value. Received: true at locationId.],
    ]
  `);
});

test('_request return full array', () => {
  const input = { _request: 'arr' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toEqual([{ a: 'request a1' }, { a: 'request a2' }]);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request return number', () => {
  const input = { _request: 'number' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(500);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});

test('_request null', () => {
  const input = { _request: null };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _request accepts a string value. Received: null at locationId.],
    ]
  `);
});

test('_request loading true', () => {
  const input = { _request: 'not_loaded' };
  const parser = new WebParser({ context, contexts });
  const res = parser.parse({ input, location: 'locationId', arrayIndices });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`Array []`);
});
