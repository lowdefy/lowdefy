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

import { jest } from '@jest/globals';

import jsMapParser from './jsMapParser.js';

function createContext({ keyMap } = {}) {
  return { errors: [], keyMap: keyMap ?? {}, handleWarning: jest.fn() };
}

function withKey(obj, key) {
  Object.defineProperty(obj, '~k', { value: key, enumerable: false });
  return obj;
}

test('jsMapParser hashes string form and returns _js hash', () => {
  const jsMap = {};
  const input = { x: { _js: 'return 1;' } };
  const result = jsMapParser({ input, jsMap, env: 'client', context: createContext() });

  expect(typeof result.x._js).toBe('string');
  expect(jsMap.client[result.x._js]).toBe('return 1;');
});

test('jsMapParser identical string sources share a hash', () => {
  const jsMap = {};
  const input = {
    a: { _js: 'return 2;' },
    b: { _js: 'return 2;' },
  };
  const result = jsMapParser({ input, jsMap, env: 'client', context: createContext() });

  expect(result.a._js).toBe(result.b._js);
  expect(Object.keys(jsMap.client)).toHaveLength(1);
});

test('jsMapParser object form hashes fn and preserves args', () => {
  const jsMap = {};
  const fnSource = 'return args.a + args.b;';
  const input = {
    x: { _js: { fn: fnSource, args: { a: 1, b: 2 } } },
  };
  const result = jsMapParser({ input, jsMap, env: 'server', context: createContext() });

  expect(result.x._js.args).toEqual({ a: 1, b: 2 });
  expect(typeof result.x._js.fn).toBe('string');
  expect(jsMap.server[result.x._js.fn]).toBe(fnSource);
});

test('jsMapParser object form without args leaves args undefined', () => {
  const jsMap = {};
  const input = { x: { _js: { fn: 'return 1;' } } };
  const result = jsMapParser({ input, jsMap, env: 'client', context: createContext() });

  expect(result.x._js.args).toBeUndefined();
  expect(typeof result.x._js.fn).toBe('string');
});

test('jsMapParser object form and string form with same fn share a hash', () => {
  const jsMap = {};
  const input = {
    a: { _js: 'return 7;' },
    b: { _js: { fn: 'return 7;', args: { note: 'different args' } } },
  };
  const result = jsMapParser({ input, jsMap, env: 'client', context: createContext() });

  expect(result.a._js).toBe(result.b._js.fn);
  expect(Object.keys(jsMap.client)).toHaveLength(1);
});

test('jsMapParser throws when _js value is a number', () => {
  const jsMap = {};
  const input = { x: { _js: 1 } };

  expect(() => jsMapParser({ input, jsMap, env: 'client', context: createContext() })).toThrow(
    '_js operator expects a JavaScript string or { fn: string, args?: object }'
  );
});

test('jsMapParser throws when object form is missing fn', () => {
  const jsMap = {};
  const input = { x: { _js: { args: { a: 1 } } } };

  expect(() => jsMapParser({ input, jsMap, env: 'client', context: createContext() })).toThrow(
    '_js operator expects a JavaScript string or { fn: string, args?: object }'
  );
});

test('jsMapParser throws when object form fn is not a string', () => {
  const jsMap = {};
  const input = { x: { _js: { fn: 42, args: {} } } };

  expect(() => jsMapParser({ input, jsMap, env: 'client', context: createContext() })).toThrow(
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
  const result = jsMapParser({ input, jsMap, env: 'client', context: createContext() });

  expect(typeof result.x._js.fn).toBe('string');
  expect(typeof result.x._js.args.inner._js).toBe('string');
  expect(jsMap.client[result.x._js.fn]).toBe('return args.inner;');
  expect(jsMap.client[result.x._js.args.inner._js]).toBe('return 99;');
});

test('jsMapParser initializes jsMap env bucket when missing', () => {
  const jsMap = {};
  jsMapParser({
    input: { a: { _js: 'return 1;' } },
    jsMap,
    env: 'client',
    context: createContext(),
  });

  expect(jsMap.client).toBeDefined();
  expect(Object.keys(jsMap.client)).toHaveLength(1);
});

test('jsMapParser reports an undefined name as a ConfigError carrying the node configKey and js-lint slug', () => {
  const jsMap = {};
  const context = createContext();
  const input = { x: withKey({ _js: 'return unlinked.stamp;' }, 'k1') };
  jsMapParser({ input, jsMap, env: 'client', context });

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].name).toBe('ConfigError');
  expect(context.errors[0].message).toBe(
    '_js body references "unlinked", which is not defined, at line 1. Available: actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user, and the JavaScript standard library.'
  );
  expect(context.errors[0].configKey).toBe('k1');
  expect(context.errors[0].checkSlug).toBe('js-lint');
  expect(context.errors[0].received).toBe('return unlinked.stamp;');
});

test('jsMapParser names the server prototype and browser globals for a server body using document', () => {
  const jsMap = {};
  const context = createContext();
  const input = { x: withKey({ _js: { fn: 'return document.title;' } }, 'k1') };
  jsMapParser({ input, jsMap, env: 'server', context });

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    '_js body references "document", which is not defined, at line 1. Available: args, item, lowdefyApp, payload, secret, state, step, user, and the JavaScript standard library. This body runs on the server — browser globals such as "document" and "window" are not available.'
  );
});

test('jsMapParser reports a syntax error as a ConfigError', () => {
  const jsMap = {};
  const context = createContext();
  const input = { x: withKey({ _js: 'return (1;' }, 'k1') };
  jsMapParser({ input, jsMap, env: 'client', context });

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    '_js body has a syntax error at line 1: Unexpected token ;.'
  );
  expect(context.errors[0].configKey).toBe('k1');
  expect(context.errors[0].checkSlug).toBe('js-lint');
});

test('jsMapParser reports an unused declaration as a ConfigWarning', () => {
  const jsMap = {};
  const context = createContext();
  const input = { x: withKey({ _js: 'const stampAt = 1;\nreturn 2;' }, 'k1') };
  jsMapParser({ input, jsMap, env: 'client', context });

  expect(context.errors).toHaveLength(0);
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  const warning = context.handleWarning.mock.calls[0][0];
  expect(warning.name).toBe('ConfigWarning');
  expect(warning.message).toBe('_js body declares "stampAt" but never uses it, at line 1.');
  expect(warning.configKey).toBe('k1');
  expect(warning.checkSlug).toBe('js-lint');
});

test('jsMapParser reports the same body at two configKeys twice', () => {
  const jsMap = {};
  const context = createContext();
  const input = {
    a: withKey({ _js: 'return nope;' }, 'ka'),
    b: withKey({ _js: 'return nope;' }, 'kb'),
  };
  jsMapParser({ input, jsMap, env: 'client', context });

  expect(Object.keys(jsMap.client)).toHaveLength(1);
  expect(context.errors.map((e) => e.configKey)).toEqual(['ka', 'kb']);
});

test('jsMapParser ~ignoreBuildChecks js-lint suppresses lint errors', () => {
  const jsMap = {};
  const context = createContext({
    keyMap: { parent: { '~ignoreBuildChecks': ['js-lint'] }, k1: { '~k_parent': 'parent' } },
  });
  const input = { x: withKey({ _js: 'return nope;' }, 'k1') };
  jsMapParser({ input, jsMap, env: 'client', context });

  expect(context.errors).toHaveLength(0);
});

test('jsMapParser does not lint a clean body into errors or warnings', () => {
  const jsMap = {};
  const context = createContext();
  const input = { x: withKey({ _js: 'const a = state("a");\nreturn a * 2;' }, 'k1') };
  jsMapParser({ input, jsMap, env: 'client', context });

  expect(context.errors).toHaveLength(0);
  expect(context.handleWarning).not.toHaveBeenCalled();
});
