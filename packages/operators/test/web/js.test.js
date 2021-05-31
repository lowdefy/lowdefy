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
beforeAll(async () => {
  await _js.init();
});

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

// ! --------------
// ! DEPRECATED
// ! --------------
test('_js with code and args specified', () => {
  const params = {
    code: `function (one, two) {
  return one + two;
}`,
    args: [12, 14],
  };
  const fn = _js({ context, location, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn(1, 2)).toEqual(3);
  expect(_js({ context, location, params, methodName: 'evaluate' })).toEqual(26);
  expect(_js({ context, location, params: { code: params.code }, methodName: 'evaluate' })).toEqual(
    null
  );
});

test('_js with code and args specified to return json object', () => {
  const params = {
    code: `function (one, two) {
  return { a: one, b: two, c: [1,2,3, one, two, "three"]};
}`,
    args: [12, 14],
  };
  const fn = _js({ context, location, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn(1, 2)).toEqual({ a: 1, b: 2, c: [1, 2, 3, 1, 2, 'three'] });
  expect(_js({ context, location, params, methodName: 'evaluate' })).toEqual({
    a: 12,
    b: 14,
    c: [1, 2, 3, 12, 14, 'three'],
  });
  expect(_js({ context, location, params: { code: params.code }, methodName: 'evaluate' })).toEqual(
    {
      c: [1, 2, 3, null, null, 'three'],
    }
  );
});

test('_js with code and args specified to return json array', () => {
  const params = {
    code: `function (one, two) {
  return [1,2,3, one, two, "three"];
}`,
    args: [12, 14],
  };
  const fn = _js({ context, location, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn(1, 2)).toEqual([1, 2, 3, 1, 2, 'three']);
  expect(_js({ context, location, params, methodName: 'evaluate' })).toEqual([
    1,
    2,
    3,
    12,
    14,
    'three',
  ]);
  expect(_js({ context, location, params: { code: params.code }, methodName: 'evaluate' })).toEqual(
    [1, 2, 3, null, null, 'three']
  );
});

test('_js with open "\'" in result', () => {
  const str = `<div style=\"test: one;\">one's result</div>`;
  const params = {
    code: `function chars(input) {
      return [{x: input, b: 1}];
    }`,
    args: [str],
  };
  const fn = _js({ context, location, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn(str)).toEqual([{ x: str, b: 1 }]);
  expect(_js({ context, location, params, methodName: 'evaluate' })).toEqual([{ x: str, b: 1 }]);
});

test('_js with date in input and result', () => {
  const params = {
    code: `function duration(from, to) {
      return {
        from, 
        to, 
        fromIsDate: from instanceof Date,
        toIsDate: from instanceof Date,
        duration: to - from,
      };
    }`,
    args: [new Date(0), new Date(10)],
  };
  const fn = _js({ context, location, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);

  expect(_js({ context, location, params, methodName: 'evaluate' })).toEqual({
    from: new Date(0),
    to: new Date(10),
    duration: 10,
    fromIsDate: true,
    toIsDate: true,
  });
  expect(fn(new Date(0), new Date(10))).toEqual({
    from: new Date(0),
    to: new Date(10),
    duration: 10,
    fromIsDate: true,
    toIsDate: true,
  });
});

test('_js with undefined result returns null', () => {
  const params = {
    code: `function add(one, two) {
      return;
    }`,
    args: [12, 14],
  };
  const fn = _js({ context, location, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn()).toEqual(null);
  expect(_js({ context, location, params, methodName: 'evaluate' })).toEqual(null);
  expect(_js({ context, location, params: { code: params.code }, methodName: 'evaluate' })).toEqual(
    null
  );
});

test('_js with console.log', () => {
  const logger = console.log;
  console.log = jest.fn();
  const params = {
    code: `function logTest(one, two) {
      console.log(one)
      console.log(two)
      console.log(one, two, null, 123, 'abc', true, false);
      return;
    }`,
    args: [12, new Date(1)],
  };
  const fn = _js({ context, location, params, methodName: 'function' });
  expect(fn).toBeInstanceOf(Function);
  _js({ context, location, params, methodName: 'evaluate' });
  expect(console.log.mock.calls).toEqual([
    [12],
    [new Date(1)],
    [12, new Date(1), null, 123, 'abc', true, false],
  ]);
  console.log = logger;
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
  expect(_js({ context, location, params, methodName: 'evaluate' })).toEqual(
    '<div><a href="https://lowdefy.com">Lowdefy Website</a></html>'
  );
  const fn = _js({ context, location, params, methodName: 'function' });
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
    _js({ context, location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(`"unexpected token in expression: 'var'"`);
  expect(() => {
    const fn = _js({ context, location, params, methodName: 'function' });
    fn();
  }).toThrowErrorMatchingInlineSnapshot(`"unexpected token in expression: 'var'"`);
});

test('_js invalid js code', () => {
  const params = {
    code: 'Hello',
  };
  expect(() =>
    _js({ context, location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(`"'Hello' is not defined"`);
  const fn = _js({ context, location, params, methodName: 'function' });
  expect(() => fn()).toThrowErrorMatchingInlineSnapshot(`"'Hello' is not defined"`);
});

test('_js not a function', () => {
  const params = {
    code: '"Hello"',
  };
  expect(() =>
    _js({ context, location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(`"not a function"`);
  const fn = _js({ context, location, params, methodName: 'function' });
  expect(() => fn()).toThrowErrorMatchingInlineSnapshot(`"not a function"`);
});

test('_js params not a object', () => {
  const params = [];
  expect(() =>
    _js({ context, location, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.function takes an object as input at location."`
  );
  expect(() =>
    _js({ context, location, params, methodName: 'evaluate' })
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
  expect(() =>
    _js({ context, location, params, methodName: 'invalid' })
  ).toThrowErrorMatchingInlineSnapshot(`"Operator Error: _js.invalid is not a function."`);
});

test('_js invalid js code', () => {
  const params = {
    code: 1,
  };
  expect(() =>
    _js({ context, location, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.function \\"code\\" argument should be a string at location."`
  );
  expect(() =>
    _js({ context, location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.evaluate \\"code\\" argument should be a string at location."`
  );
});

test('_js no body or file', () => {
  const params = {};
  expect(() =>
    _js({ context, location, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js.function \\"code\\" argument should be a string at location."`
  );
  expect(() =>
    _js({ context, location, params, methodName: 'evaluate' })
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
    _js({ context, location, params, methodName: 'evaluate' })
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
    _js({ context, location, params, methodName: 'function' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js is not initialized. Received: {\\"code\\":\\"{\\\\n      return args[0] + args[1]\\\\n    }\\"} at location."`
  );
  expect(() =>
    _js({ context, location, params, methodName: 'evaluate' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _js is not initialized. Received: {\\"code\\":\\"{\\\\n      return args[0] + args[1]\\\\n    }\\"} at location."`
  );
});
// ! --------------
