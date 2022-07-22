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

import { NodeParser } from '@lowdefy/operators';
import _args from './args.js';
import _function from './function.js';
import _json from './json.js';
import _not from './not.js';
import _payload from '../server/payload.js';
import _operator from './operator.js';
import _state from '../client/state.js';

const operators = {
  _args,
  _function,
  _json,
  _not,
  _payload,
  _operator,
  _state,
};

const payload = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};

test('_operator, _payload', () => {
  const input = { a: { _operator: { name: '_payload', params: 'string' } } };
  const parser = new NodeParser({ operators, payload });
  const res = parser.parse({ input });
  expect(res).toEqual({
    a: 'Some String',
  });
});

test('_operator.name invalid', () => {
  const input = { a: { _operator: { name: '_a' } } };
  const parser = new NodeParser({ operators, payload });
  expect(() => {
    parser.parse({ input });
  }).toMatchInlineSnapshot(`[Function]`);
});

test('_operator.name not allowed to include "experimental"', () => {
  const input = { a: { _operator: { name: '_experimental_op' } } };
  const parser = new NodeParser({ operators, payload });
  expect(() => {
    parser.parse({ input });
  }).toMatchInlineSnapshot(`[Function]`);
});

test('_operator.name not a string', () => {
  const input = { a: { _operator: { name: 1 } } };
  const parser = new NodeParser({ operators, payload });
  expect(() => {
    parser.parse({ input });
  }).toMatchInlineSnapshot(`[Function]`);
});

test('_operator with value not a object', () => {
  const input = { a: { _operator: 'a' } };
  const parser = new NodeParser({ operators, payload });
  expect(() => {
    parser.parse({ input });
  }).toMatchInlineSnapshot(`[Function]`);
});

test('_operator cannot be set to _operator', () => {
  const input = { a: { _operator: { name: '_operator' } } };
  const parser = new NodeParser({ operators, payload });
  expect(() => {
    parser.parse({ input });
  }).toMatchInlineSnapshot(`[Function]`);
});

test('_operator, _not with no params', () => {
  const input = { a: { _operator: { name: '_not' } } };
  const parser = new NodeParser({ operators, payload });
  const res = parser.parse({ input });
  expect(res).toEqual({ a: true });
});

test('_operator, _json.parse with params', () => {
  const input = { a: { _operator: { name: '_json.parse', params: '[{ "a": "a1"}]' } } };
  const parser = new NodeParser({ operators, payload });
  const res = parser.parse({ input });
  expect(res).toEqual({
    a: [{ a: 'a1' }],
  });
});
