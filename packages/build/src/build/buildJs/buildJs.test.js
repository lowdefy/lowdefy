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

import buildJs from './buildJs.js';
import testContext from '../../test/testContext.js';

test('buildJs default', async () => {
  const context = testContext();
  const components = {
    pages: [{ id: 'a', style: { _js: 'return 1;' }, requests: [] }],
  };

  buildJs({ components, context });
  expect(components.pages).toEqual([
    { id: 'a', requests: [], style: { _js: 'tjmrJIhufQzEpj/iGu5AumDcrBQ=' } },
  ]);
  expect(context.jsMap).toEqual({
    client: { 'tjmrJIhufQzEpj/iGu5AumDcrBQ=': 'return 1;' },
    server: {},
  });
});

test('buildJs identical function definitions', async () => {
  const context = testContext();
  const components = {
    pages: [
      { id: 'a', style: { _js: 'return 2;' }, requests: [] },
      { id: 'b', style: { _js: 'return 10;' }, requests: [] },
      { id: 'c', style: { _js: 'return 2;' }, requests: [] },
    ],
  };

  buildJs({ components, context });

  expect(components.pages).toEqual([
    { id: 'a', requests: [], style: { _js: 'XjWXGQx0Ga1LvOQtdxUpR6mZwhA=' } },
    { id: 'b', requests: [], style: { _js: 'h4uNNgee8PnSsXJuEXZQ7FSbnZY=' } },
    { id: 'c', requests: [], style: { _js: 'XjWXGQx0Ga1LvOQtdxUpR6mZwhA=' } },
  ]);

  expect(context.jsMap).toEqual({
    client: {
      'h4uNNgee8PnSsXJuEXZQ7FSbnZY=': 'return 10;',
      'XjWXGQx0Ga1LvOQtdxUpR6mZwhA=': 'return 2;',
    },
    server: {},
  });
});

test('buildJs server-side functions', async () => {
  const context = testContext();
  const components = {
    pages: [
      { id: 'a', style: { _js: 'return 1;' }, requests: [{ _js: 'return 1;' }] },
      { id: 'b', style: { _js: 'return 12;' }, requests: [{ _js: 'return 10;' }] },
      { id: 'c', style: { _js: 'return 1;' }, requests: [{ _js: 'return 1;' }] },
    ],
  };

  buildJs({ components, context });

  expect(components.pages).toEqual([
    {
      id: 'a',
      requests: [{ _js: 'tjmrJIhufQzEpj/iGu5AumDcrBQ=' }],
      style: { _js: 'tjmrJIhufQzEpj/iGu5AumDcrBQ=' },
    },
    {
      id: 'b',
      requests: [{ _js: 'h4uNNgee8PnSsXJuEXZQ7FSbnZY=' }],
      style: { _js: 'PGqYgLcEpG/AkAZycfKEpwxXT7Y=' },
    },
    {
      id: 'c',
      requests: [{ _js: 'tjmrJIhufQzEpj/iGu5AumDcrBQ=' }],
      style: { _js: 'tjmrJIhufQzEpj/iGu5AumDcrBQ=' },
    },
  ]);

  expect(context.jsMap).toEqual({
    client: {
      'PGqYgLcEpG/AkAZycfKEpwxXT7Y=': 'return 12;',
      'tjmrJIhufQzEpj/iGu5AumDcrBQ=': 'return 1;',
    },
    server: {
      'h4uNNgee8PnSsXJuEXZQ7FSbnZY=': 'return 10;',
      'tjmrJIhufQzEpj/iGu5AumDcrBQ=': 'return 1;',
    },
  });
});

test('buildJs connection functions', async () => {
  const context = testContext();
  const components = {
    pages: [
      { id: 'a', requests: [] },
      { id: 'b', requests: [] },
      { id: 'c', requests: [] },
    ],
    connections: [
      { id: 'c_a', properties: { _js: 'return 3;' } },
      { id: 'c_b', properties: { _js: 'return 10;' } },
      { id: 'c_c', properties: { _js: 'return 3;' } },
    ],
  };

  buildJs({ components, context });

  expect(components.pages).toEqual([
    { id: 'a', requests: [] },
    { id: 'b', requests: [] },
    { id: 'c', requests: [] },
  ]);
  expect(components.connections).toEqual([
    { id: 'c_a', properties: { _js: 'WtH5rMtQ+z9CJ4qYRnNWpIpRrnk=' } },
    { id: 'c_b', properties: { _js: 'h4uNNgee8PnSsXJuEXZQ7FSbnZY=' } },
    { id: 'c_c', properties: { _js: 'WtH5rMtQ+z9CJ4qYRnNWpIpRrnk=' } },
  ]);

  expect(context.jsMap).toEqual({
    client: {},
    server: {
      'WtH5rMtQ+z9CJ4qYRnNWpIpRrnk=': 'return 3;',
      'h4uNNgee8PnSsXJuEXZQ7FSbnZY=': 'return 10;',
    },
  });
});

test('buildJs throw when _js value is not a string', async () => {
  const context = testContext();
  const components = {
    pages: [{ id: 'a', style: { _js: 1 }, requests: [] }],
  };

  expect(() => buildJs({ components, context })).toThrow(
    '_js operator expects the JavaScript definition as a string'
  );
});
