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
import _experimental_unsafe_js from '../../src/common/experimental_unsafe_js';

const location = 'location';

test('_experimental_unsafe_js, function with body specified', () => {
  const params = {
    body: `{
  return args[0] + args[1]
}`,
  };
  const fn = _experimental_unsafe_js({ location, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn(1, 2)).toEqual(3);
});

test('_experimental_unsafe_js, function with file specified', () => {
  const params = {
    file: `
// Header comment

const a = 3;

function add(...args) {
  return args[0] + args[1]
}

export default add`,
  };
  const fn = _experimental_unsafe_js({ location, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn(1, 2)).toEqual(3);
});

test('_experimental_unsafe_js, evaluate with body specified', () => {
  const params = {
    args: [1, 2],
    body: `{
  return args[0] + args[1]
}`,
  };
  const res = _experimental_unsafe_js({ location, params, methodName: 'evaluate' });
  expect(res).toEqual(3);
});

test('_experimental_unsafe_js, evaluate with file specified', () => {
  const params = {
    args: [1, 2],
    file: `
// Header comment

const a = 3;

function add(...args) {
  return args[0] + args[1]
}

export default add`,
  };
  const res = _experimental_unsafe_js({ location, params, methodName: 'evaluate' });
  expect(res).toEqual(3);
});

test('_experimental_unsafe_js, params not a object', () => {
  const params = [];
  expect(() =>
    _experimental_unsafe_js({ location, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _experimental_unsafe_js takes an object as input at location."`
  );
});

test('_experimental_unsafe_js, invalid methodName', () => {
  const params = {
    body: `{
  return args[0] + args[1]
}`,
  };
  expect(() =>
    _experimental_unsafe_js({ location, params, methodName: 'invalid' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _experimental_unsafe_js.invalid is not supported  at location. Use one of the following: evaluate, function."`
  );
});

test('_experimental_unsafe_js, invalid js file', () => {
  const params = {
    file: 1,
  };
  expect(() =>
    _experimental_unsafe_js({ location, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _experimental_unsafe_js received invalid javascript file at location."`
  );
});

test('_experimental_unsafe_js, invalid js file', () => {
  const params = {
    file: 'Hello',
  };
  expect(() =>
    _experimental_unsafe_js({ location, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _experimental_unsafe_js received invalid javascript file at location."`
  );
});

test('_experimental_unsafe_js, no body or file', () => {
  const params = {};
  expect(() =>
    _experimental_unsafe_js({ location, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _experimental_unsafe_js did not receive a \\"file\\" or \\"body\\" argument at location."`
  );
});

test('_experimental_unsafe_js, body not a string', () => {
  const params = {
    body: 1,
  };
  expect(() =>
    _experimental_unsafe_js({ location, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _experimental_unsafe_js  \\"body\\" argument should be a string at location."`
  );
});

test('_experimental_unsafe_js, evaluate, args not an array', () => {
  const params = {
    args: 1,
    body: `{
      return args[0] + args[1]
    }`,
  };
  expect(() =>
    _experimental_unsafe_js({ location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _experimental_unsafe_js.evaluate  \\"args\\" argument should be an array at location."`
  );
});
