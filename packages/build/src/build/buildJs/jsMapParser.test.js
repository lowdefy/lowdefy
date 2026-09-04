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
  return { errors: [], jsBodies: [], keyMap: keyMap ?? {}, handleWarning: jest.fn() };
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

test('jsMapParser queues every hashed body on context.jsBodies for the js-lint rule', () => {
  const jsMap = {};
  const context = createContext();
  const input = {
    a: withKey({ _js: 'return 1;' }, 'ka'),
    b: withKey({ _js: { fn: 'return 2;', args: {} } }, 'kb'),
  };
  jsMapParser({ input, jsMap, env: 'server', context });

  expect(context.jsBodies).toEqual([
    { env: 'server', hash: expect.any(String), body: 'return 1;', configKey: 'ka' },
    { env: 'server', hash: expect.any(String), body: 'return 2;', configKey: 'kb' },
  ]);
  expect(context.errors).toHaveLength(0);
});

describe('module references', () => {
  let configDirectory;

  beforeEach(async () => {
    const fs = await import('fs');
    const os = await import('os');
    const path = await import('path');
    configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-js-map-parser-'));
    fs.mkdirSync(path.join(configDirectory, 'pages/lib'), { recursive: true });
    fs.writeFileSync(
      path.join(configDirectory, 'pages/lib/rows.js'),
      "import { esc } from './esc.js';\nexport function buildRows({ args }) { return esc(args.docs); }"
    );
  });

  afterEach(async () => {
    const fs = await import('fs');
    fs.rmSync(configDirectory, { recursive: true, force: true });
  });

  function moduleContext() {
    const context = createContext();
    context.directories = { config: configDirectory };
    context.jsModules = { client: {}, server: {} };
    context.refMap = { r1: { path: 'pages/home.yaml' } };
    return context;
  }

  function withRef(obj, key, refId) {
    withKey(obj, key);
    Object.defineProperty(obj, '~r', { value: refId, enumerable: false });
    return obj;
  }

  test('jsMapParser routes a ./ fn through resolveJsModule and keeps it out of jsMap and jsBodies', () => {
    const jsMap = {};
    const context = moduleContext();
    const node = withRef(
      { _js: { fn: './lib/rows.js#buildRows', args: { docs: [1] } } },
      'k1',
      'r1'
    );
    const result = jsMapParser({ input: { x: node }, jsMap, env: 'client', context });

    const hash = result.x._js.fn;
    expect(result.x._js.args).toEqual({ docs: [1] });
    expect(context.jsModules.client[hash]).toMatchObject({
      exportName: 'buildRows',
      relativePath: 'pages/lib/rows.js',
      configKey: 'k1',
    });
    // The module is a real file the author's own tooling lints — its import
    // statement must never reach the inline-body lint.
    expect(jsMap.client).toEqual({});
    expect(context.jsBodies).toEqual([]);
  });

  test('jsMapParser throws a js-modules ConfigError for a malformed module reference', () => {
    const context = moduleContext();
    const node = withRef({ _js: { fn: '../lib/rows.js' } }, 'k1', 'r1');
    let error;
    try {
      jsMapParser({ input: { x: node }, jsMap: {}, env: 'client', context });
    } catch (e) {
      error = e;
    }
    expect(error.message).toBe(
      '_js module reference must be "<relative path to a .js or .mjs file>#<exportName>". Received "../lib/rows.js".'
    );
    expect(error.configKey).toBe('k1');
    expect(error.checkSlug).toBe('js-modules');
  });

  test('jsMapParser treats a string-form _js starting with ./ as source text', () => {
    const jsMap = {};
    const context = moduleContext();
    const result = jsMapParser({
      input: { x: { _js: './not/a/module.js#x' } },
      jsMap,
      env: 'client',
      context,
    });
    expect(jsMap.client[result.x._js]).toBe('./not/a/module.js#x');
    expect(context.jsModules.client).toEqual({});
  });
});
