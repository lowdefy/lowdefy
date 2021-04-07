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

const location = 'location';
beforeAll(async () => {
  await _js.init();
});

test('_js with code and args specified', () => {
  const params = {
    code: `function (one, two) {
  return one + two;
}`,
    args: [12, 14],
  };
  const fn = _js({ location, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn(1, 2)).toEqual(3);
  expect(_js({ location, params, methodName: 'evaluate' })).toEqual(26);
  expect(_js({ location, params: { code: params.code }, methodName: 'evaluate' })).toEqual(null);
});

test('_js with code and args specified named function', () => {
  const params = {
    code: `function add(one, two) {
  return one + two;
}`,
    args: [12, 14],
  };
  const fn = _js({ location, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn(1, 2)).toEqual(3);
  expect(_js({ location, params, methodName: 'evaluate' })).toEqual(26);
  expect(_js({ location, params: { code: params.code }, methodName: 'evaluate' })).toEqual(null);
});

test('_js with undefined result returns null', () => {
  const params = {
    code: `function add(one, two) {
      return;
    }`,
    args: [12, 14],
  };
  const fn = _js({ location, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn()).toEqual(null);
  expect(_js({ location, params, methodName: 'evaluate' })).toEqual(null);
  expect(_js({ location, params: { code: params.code }, methodName: 'evaluate' })).toEqual(null);
});

test('_js with code with args that needs escaped characters', () => {
  const params = {
    code: `function (obj) {
      return "<div>" + obj.html + "</html>";
    }`,
    args: [
      {
        html: '<a href="https://lowdefy.com">Lowdefy Website</a>',
      },
    ],
  };
  expect(_js({ location, params, methodName: 'evaluate' })).toEqual(
    '<div><a href="https://lowdefy.com">Lowdefy Website</a></html>'
  );
  const fn = _js({ location, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);
  expect(
    fn({
      html: '<a href="https://lowdefy.com">Lowdefy Website</a>',
    })
  ).toEqual('<div><a href="https://lowdefy.com">Lowdefy Website</a></html>');
});

test('_js with code and no "function" specified to throw', () => {
  const params = {
    code: `
      var value = "world";
      var result = 'a new ' + 'vm for Hello ' +  value;
`,
  };

  expect(() =>
    _js({ location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(`"unexpected token in expression: 'var'"`);
  expect(() => {
    const fn = _js({ location, params, methodName: 'function' });
    fn();
  }).toThrowErrorMatchingInlineSnapshot(`"unexpected token in expression: 'var'"`);
});

test('_js invalid js code', () => {
  const params = {
    code: 'Hello',
  };
  expect(() =>
    _js({ location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(`"'Hello' is not defined"`);
  const fn = _js({ location, params, methodName: 'function' });
  expect(() => fn()).toThrowErrorMatchingInlineSnapshot(`"'Hello' is not defined"`);
});

test('_js not a function', () => {
  const params = {
    code: '"Hello"',
  };
  expect(() =>
    _js({ location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(`"not a function"`);
  const fn = _js({ location, params, methodName: 'function' });
  expect(() => fn()).toThrowErrorMatchingInlineSnapshot(`"not a function"`);
});

test('_js params not a object', () => {
  const params = [];
  expect(() =>
    _js({ location, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.function takes an object as input at location."`
  );
  expect(() =>
    _js({ location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.evaluate takes an object as input at location."`
  );
});

test('_js.invalid methodName', () => {
  const params = {
    code: `function () {
  return args[0] + args[1]
}`,
  };
  expect(() => _js({ location, params, methodName: 'invalid' })).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.invalid is not supported at location. Use one of the following: evaluate, function."`
  );
});

test('_js invalid js code', () => {
  const params = {
    code: 1,
  };
  expect(() =>
    _js({ location, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.function \\"code\\" argument should be a string at location."`
  );
  expect(() =>
    _js({ location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.evaluate \\"code\\" argument should be a string at location."`
  );
});

test('_js no body or file', () => {
  const params = {};
  expect(() =>
    _js({ location, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.function \\"code\\" argument should be a string at location."`
  );
  expect(() =>
    _js({ location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.evaluate \\"code\\" argument should be a string at location."`
  );
});

test('_js.evaluate, args not an array', () => {
  const params = {
    args: 1,
    body: `function () {
      return args[0] + args[1]
    }`,
  };
  expect(() =>
    _js({ location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.evaluate \\"args\\" argument should be an array, null or undefined at location."`
  );
});

test('_js with undefined vm', () => {
  const params = {
    code: `{
      return args[0] + args[1]
    }`,
  };
  _js.clear();
  expect(() =>
    _js({ location, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js is not initialized. Received: {\\"code\\":\\"{\\\\n      return args[0] + args[1]\\\\n    }\\"} at location."`
  );
  expect(() =>
    _js({ location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js is not initialized. Received: {\\"code\\":\\"{\\\\n      return args[0] + args[1]\\\\n    }\\"} at location."`
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
