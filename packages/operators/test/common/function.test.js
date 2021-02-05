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
import NodeParser from '../../src/nodeParser';
import WebParser from '../../src/webParser';
import _function from '../../src/common/function';

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const location = 'location';

const context = {
  state,
};

const contexts = {};

test('NodeParser, _function that gets from state', () => {
  const parser = new NodeParser({ state });
  const params = { __state: 'string' };
  const fn = _function({ location, params, parser });
  expect(fn).toBeInstanceOf(Function);
  expect(fn()).toEqual('Some String');
  expect(fn()).toEqual('Some String');
});

test('NodeParser, _function gives args as an array', () => {
  const parser = new NodeParser({ state });
  const params = { __args: true };
  const fn = _function({ location, params, parser });
  expect(fn('a')).toEqual(['a']);
  expect(fn('a', { b: true })).toEqual(['a', { b: true }]);
});

test('NodeParser, _function throws on parser errors', () => {
  const parser = new NodeParser({ state });
  const params = { __state: [] };
  const fn = _function({ location, params, parser });
  expect(fn).toThrow(
    'Error: Operator Error: _state params must be of type string, boolean or object. Received: [] at location.'
  );
});

test('WebParser, _function that gets from state', () => {
  const parser = new WebParser({ context, contexts });
  const params = { __state: 'string' };
  const fn = _function({ location, params, parser });
  expect(fn).toBeInstanceOf(Function);
  expect(fn()).toEqual('Some String');
  expect(fn()).toEqual('Some String');
});

test('WebParser, _function gives args as an array', () => {
  const parser = new WebParser({ context, contexts });
  const params = { __args: true };
  const fn = _function({ location, params, parser });
  expect(fn('a')).toEqual(['a']);
  expect(fn('a', { b: true })).toEqual(['a', { b: true }]);
});

test('WebParser, _function throws on parser errors', () => {
  const parser = new WebParser({ context, contexts });
  const params = { __state: [] };
  const fn = _function({ location, params, parser });
  expect(fn).toThrow(
    'Error: Operator Error: _state params must be of type string, boolean or object. Received: [] at location.'
  );
});
