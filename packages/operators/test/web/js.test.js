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

import _js from '../../src/web/js';
import { context } from '../testContext';

const location = 'location';

test('_js.test_fn and params to return a value', () => {
  const params = [12, 14];
  const test_fn = (a, b) => a + b;
  const mockFn = jest.fn().mockImplementation(test_fn);
  context.lowdefy.imports.jsOperators.test_fn = mockFn;
  expect(_js({ context, location, params, methodName: 'test_fn' })).toEqual(26);
});

test('_js.test_fn no params to return a value', () => {
  const test_fn = () => 'some value';
  const mockFn = jest.fn().mockImplementation(test_fn);
  context.lowdefy.imports.jsOperators.test_fn = mockFn;
  expect(_js({ context, location, params: undefined, methodName: 'test_fn' })).toEqual(
    'some value'
  );
});

test('_js.test_fn and params to return a function', () => {
  const params = [12, 14];
  const test_fn = (a, b) => (c) => a + b + c;
  const mockFn = jest.fn().mockImplementation(test_fn);
  context.lowdefy.imports.jsOperators.test_fn = mockFn;
  const fn = _js({ context, location, params, methodName: 'test_fn' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn(4)).toEqual(30);
});

test('_js.test_fn params not an array', () => {
  const params = 10;
  const test_fn = (a, b) => a + b;
  const mockFn = jest.fn().mockImplementation(test_fn);
  context.lowdefy.imports.jsOperators.test_fn = mockFn;
  expect(() => _js({ context, location, params, methodName: 'test_fn' })).toThrow(
    new Error('Operator Error: _js.test_fn takes an array as input at location.')
  );
});

test('_js.not_a_function', () => {
  const params = 10;
  const test_fn = (a, b) => a + b;
  const mockFn = jest.fn().mockImplementation(test_fn);
  context.lowdefy.imports.jsOperators.test_fn = mockFn;
  expect(() => _js({ context, location, params, methodName: 'not_a_function' })).toThrow(
    new Error('Operator Error: _js.not_a_function is not a function.')
  );
});
