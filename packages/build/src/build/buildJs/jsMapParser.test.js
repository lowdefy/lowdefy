/*
  Copyright 2020-2026 Lowdefy, Inc

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

import jsMapParser from './jsMapParser.js';

test('jsMapParser hashes string form and returns _js hash', () => {
  const jsMap = {};
  const input = { x: { _js: 'return 1;' } };
  const result = jsMapParser({ input, jsMap, env: 'client' });

  expect(typeof result.x._js).toBe('string');
  expect(jsMap.client[result.x._js]).toBe('return 1;');
});

test('jsMapParser identical string sources share a hash', () => {
  const jsMap = {};
  const input = {
    a: { _js: 'return 2;' },
    b: { _js: 'return 2;' },
  };
  const result = jsMapParser({ input, jsMap, env: 'client' });

  expect(result.a._js).toBe(result.b._js);
  expect(Object.keys(jsMap.client)).toHaveLength(1);
});

test('jsMapParser object form hashes fn and preserves args', () => {
  const jsMap = {};
  const fnSource = 'return args.a + args.b;';
  const input = {
    x: { _js: { fn: fnSource, args: { a: 1, b: 2 } } },
  };
  const result = jsMapParser({ input, jsMap, env: 'server' });

  expect(result.x._js.args).toEqual({ a: 1, b: 2 });
  expect(typeof result.x._js.fn).toBe('string');
  expect(jsMap.server[result.x._js.fn]).toBe(fnSource);
});

test('jsMapParser object form without args leaves args undefined', () => {
  const jsMap = {};
  const input = { x: { _js: { fn: 'return 1;' } } };
  const result = jsMapParser({ input, jsMap, env: 'client' });

  expect(result.x._js.args).toBeUndefined();
  expect(typeof result.x._js.fn).toBe('string');
});

test('jsMapParser object form and string form with same fn share a hash', () => {
  const jsMap = {};
  const input = {
    a: { _js: 'return 7;' },
    b: { _js: { fn: 'return 7;', args: { note: 'different args' } } },
  };
  const result = jsMapParser({ input, jsMap, env: 'client' });

  expect(result.a._js).toBe(result.b._js.fn);
  expect(Object.keys(jsMap.client)).toHaveLength(1);
});

test('jsMapParser throws when _js value is a number', () => {
  const jsMap = {};
  const input = { x: { _js: 1 } };

  expect(() => jsMapParser({ input, jsMap, env: 'client' })).toThrow(
    '_js operator expects a JavaScript string or { fn: string, args?: object }'
  );
});

test('jsMapParser throws when object form is missing fn', () => {
  const jsMap = {};
  const input = { x: { _js: { args: { a: 1 } } } };

  expect(() => jsMapParser({ input, jsMap, env: 'client' })).toThrow(
    '_js operator expects a JavaScript string or { fn: string, args?: object }'
  );
});

test('jsMapParser throws when object form fn is not a string', () => {
  const jsMap = {};
  const input = { x: { _js: { fn: 42, args: {} } } };

  expect(() => jsMapParser({ input, jsMap, env: 'client' })).toThrow(
    '_js operator expects a JavaScript string or { fn: string, args?: object }'
  );
});

test('jsMapParser processes nested _js inside args', () => {
  const jsMap = {};
  const input = {
    x: {
      _js: {
        fn: 'return args.inner;',
        args: { inner: { _js: 'return 99;' } },
      },
    },
  };
  const result = jsMapParser({ input, jsMap, env: 'client' });

  expect(typeof result.x._js.fn).toBe('string');
  expect(typeof result.x._js.args.inner._js).toBe('string');
  expect(jsMap.client[result.x._js.fn]).toBe('return args.inner;');
  expect(jsMap.client[result.x._js.args.inner._js]).toBe('return 99;');
});

test('jsMapParser initializes jsMap env bucket when missing', () => {
  const jsMap = {};
  jsMapParser({ input: { a: { _js: 'return 1;' } }, jsMap, env: 'client' });

  expect(jsMap.client).toBeDefined();
  expect(Object.keys(jsMap.client)).toHaveLength(1);
});
