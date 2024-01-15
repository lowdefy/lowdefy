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

import { ServerParser } from '@lowdefy/operators';
import _nunjucks from './nunjucks.js';

const operators = {
  _nunjucks,
};

const payload = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};

console.error = () => {};

test('_nunjucks string template', () => {
  const input = { _nunjucks: 'String with {{ string }} embedded' };
  const parser = new ServerParser({ operators, payload, secrets: {}, user: {} });
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual('String with Some String embedded');
  expect(res.errors).toEqual([]);
});

test('_nunjucks null', () => {
  const input = { _nunjucks: null };
  const parser = new ServerParser({ operators, payload, secrets: {}, user: {} });
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toEqual([]);
});

test('_nunjucks { template: , on: }', () => {
  const input = {
    _nunjucks: { template: 'String with {{ string }} embedded', on: { string: 'test' } },
  };
  const parser = new ServerParser({ operators, payload, secrets: {}, user: {} });
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toEqual('String with test embedded');
  expect(res.errors).toEqual([]);
});

test('_nunjucks template not a string', () => {
  const input = { _nunjucks: ['String with {{ string }} embedded'] };
  const parser = new ServerParser({ operators, payload, secrets: {}, user: {} });
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toEqual([]);
});

test('_nunjucks params on template not a string', () => {
  const input = {
    _nunjucks: { template: ['String with {{ string }} embedded'], on: { string: 'test' } },
  };
  const parser = new ServerParser({ operators, payload, secrets: {}, user: {} });
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toEqual([]);
});

test('_nunjucks on not a object', () => {
  const input = {
    _nunjucks: { template: 'String with {{ string }} embedded', on: [{ string: 'test' }] },
  };
  const parser = new ServerParser({ operators, payload, secrets: {}, user: {} });
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe('String with  embedded');
  expect(res.errors).toEqual([]);
});

test('_nunjucks on null', () => {
  const input = {
    _nunjucks: { template: 'String with {{ string }} embedded', on: null },
  };
  const parser = new ServerParser({ operators, payload, secrets: {}, user: {} });
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe('String with  embedded');
  expect(res.errors).toEqual([]);
});

test('_nunjucks invalid template', () => {
  const input = { _nunjucks: 'String with {{ string  embedded' };
  const parser = new ServerParser({ operators, payload, secrets: {}, user: {} });
  const res = parser.parse({ input, location: 'locationId' });
  expect(res.output).toBe(null);
  expect(res.errors).toMatchInlineSnapshot(`
    Array [
      [Error: Operator Error: _nunjucks failed to parse nunjucks template. Received: "String with {{ string  embedded" at locationId.],
    ]
  `);
});
