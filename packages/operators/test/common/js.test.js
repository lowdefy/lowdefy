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

import _js from '../../src/common/js';
import { getQuickJS } from 'quickjs-emscripten';

const location = 'location';
let instances;
beforeAll(async () => {
  const QuickJs = await getQuickJS();
  const QuickJsVm = QuickJs.createVm();
  instances = { QuickJsVm };
});

test('_js.function with body and args specified', () => {
  const params = {
    body: `{
  return args[0] + args[1]
}`,
  };
  const fn = _js({ location, instances, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn(1, 2)).toEqual(3);
});

test('_js.function with body and no args specified', () => {
  const params = {
    body: `{
      const value = "world";
  return 'a new ' + 'vm for Hello ' +  value;
}`,
  };
  const fn = _js({ location, instances, params, methodName: 'evaluate' });
  expect(_js({ location, instances, params, methodName: 'evaluate' })).toEqual(
    'a new vm for Hello world'
  );
});

test('_js.function with file specified', () => {
  const params = {
    file: `
// Header comment

const a = 3;

function add(...args) {
  return args[0] + args[1]
}

export default add`,
  };
  const fn = _js({ location, instances, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn(1, 2)).toEqual(3);
});

test('_js.evaluate with body specified', () => {
  const params = {
    args: [1, 2],
    body: `{
  return args[0] + args[1]
}`,
  };
  const res = _js({ location, instances, params, methodName: 'evaluate' });
  expect(res).toEqual(3);
});

test('_js.evaluate with file specified', () => {
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
  const res = _js({ location, instances, params, methodName: 'evaluate' });
  expect(res).toEqual(3);
});

test('_js.function params not a object', () => {
  const params = [];
  expect(() =>
    _js({ location, instances, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.function takes an object as input at location."`
  );
});

test('_js.invalid methodName', () => {
  const params = {
    body: `{
  return args[0] + args[1]
}`,
  };
  expect(() =>
    _js({ location, instances, params, methodName: 'invalid' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.invalid is not supported  at location. Use one of the following: evaluate, function."`
  );
});

test('_js.function invalid js file', () => {
  const params = {
    file: 1,
  };
  expect(() =>
    _js({ location, instances, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js received invalid javascript file at location."`
  );
});

test('_js.function invalid js file', () => {
  const params = {
    file: 'Hello',
  };
  expect(() =>
    _js({ location, instances, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js received invalid javascript file at location."`
  );
});

test('_js.function no body or file', () => {
  const params = {};
  expect(() =>
    _js({ location, instances, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.function did not receive a \\"file\\" or \\"body\\" argument at location."`
  );
});

test('_js.function body not a string', () => {
  const params = {
    body: 1,
  };
  expect(() =>
    _js({ location, instances, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.function \\"body\\" argument should be a string at location."`
  );
});

test('_js.evaluate, args not an array', () => {
  const params = {
    args: 1,
    body: `{
      return args[0] + args[1]
    }`,
  };
  expect(() =>
    _js({ location, instances, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.evaluate \\"args\\" argument should be an array, null or undefined at location."`
  );
});

test('_js with undefined vm', () => {
  const params = {
    body: `{
      return args[0] + args[1]
    }`,
  };
  expect(() =>
    _js({ location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js requires an instance of QuickJsVm. Received: {\\"body\\":\\"{\\\\n      return args[0] + args[1]\\\\n    }\\"} at location."`
  );
  expect(() =>
    _js({ location, instances: {}, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js requires an instance of QuickJsVm. Received: {\\"body\\":\\"{\\\\n      return args[0] + args[1]\\\\n    }\\"} at location."`
  );
});

// TODO: interrupt handler does not seem to work.
// test('_js interrupts infinite loop execution', () => {
//   const params = {
//     body: `{
//       i = 0; while (1) { i++ }
//     }`,
//   };
//   expect(() =>
//     _js({ location, instances, params, methodName: 'evaluate' })
//   ).toThrowErrorMatchingInlineSnapshot();
// });
