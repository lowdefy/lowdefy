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

import jsLint from './jsLint.js';
import jsMapParser from '../build/buildJs/jsMapParser.js';

function createContext({ keyMap } = {}) {
  return { errors: [], jsBodies: [], keyMap: keyMap ?? {}, handleWarning: jest.fn() };
}

function withKey(obj, key) {
  Object.defineProperty(obj, '~k', { value: key, enumerable: false });
  return obj;
}

function lint({ input, env = 'client', keyMap }) {
  const context = createContext({ keyMap });
  jsMapParser({ input, jsMap: {}, env, context });
  jsLint.run({ components: {}, context });
  return context;
}

test('jsLint is registered as js-lint and also fails normal builds', () => {
  expect(jsLint.slug).toBe('js-lint');
  expect(jsLint.checkOnly).toBe(false);
});

test('jsLint reports an undefined name as a ConfigError carrying the node configKey and js-lint slug', () => {
  const context = lint({ input: { x: withKey({ _js: 'return unlinked.stamp;' }, 'k1') } });

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].name).toBe('ConfigError');
  expect(context.errors[0].message).toBe(
    '_js body references "unlinked", which is not defined, at line 1. Available: actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user, and the JavaScript standard library.'
  );
  expect(context.errors[0].configKey).toBe('k1');
  expect(context.errors[0].checkSlug).toBe('js-lint');
  expect(context.errors[0].received).toBe('return unlinked.stamp;');
});

test('jsLint names the server prototype and browser globals for a server body using document', () => {
  const context = lint({
    input: { x: withKey({ _js: { fn: 'return document.title;' } }, 'k1') },
    env: 'server',
  });

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    '_js body references "document", which is not defined, at line 1. Available: args, item, lowdefyApp, payload, secret, state, step, user, and the JavaScript standard library. This body runs on the server — browser globals such as "document" and "window" are not available.'
  );
});

test('jsLint reports a syntax error as a ConfigError', () => {
  const context = lint({ input: { x: withKey({ _js: 'return (1;' }, 'k1') } });

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    '_js body has a syntax error at line 1: Unexpected token ;.'
  );
  expect(context.errors[0].configKey).toBe('k1');
  expect(context.errors[0].checkSlug).toBe('js-lint');
});

test('jsLint reports an unused declaration as a ConfigWarning', () => {
  const context = lint({ input: { x: withKey({ _js: 'const stampAt = 1;\nreturn 2;' }, 'k1') } });

  expect(context.errors).toHaveLength(0);
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  const warning = context.handleWarning.mock.calls[0][0];
  expect(warning.name).toBe('ConfigWarning');
  expect(warning.message).toBe('_js body declares "stampAt" but never uses it, at line 1.');
  expect(warning.configKey).toBe('k1');
  expect(warning.checkSlug).toBe('js-lint');
});

test('jsLint reports the same body at two configKeys twice', () => {
  const context = lint({
    input: {
      a: withKey({ _js: 'return nope;' }, 'ka'),
      b: withKey({ _js: 'return nope;' }, 'kb'),
    },
  });

  expect(context.errors.map((e) => e.configKey)).toEqual(['ka', 'kb']);
});

test('jsLint ~ignoreBuildChecks js-lint suppresses lint errors', () => {
  const context = lint({
    input: { x: withKey({ _js: 'return nope;' }, 'k1') },
    keyMap: { parent: { '~ignoreBuildChecks': ['js-lint'] }, k1: { '~k_parent': 'parent' } },
  });

  expect(context.errors).toHaveLength(0);
});

test('jsLint does not lint a clean body into errors or warnings', () => {
  const context = lint({
    input: { x: withKey({ _js: 'const a = state("a");\nreturn a * 2;' }, 'k1') },
  });

  expect(context.errors).toHaveLength(0);
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('jsLint drains the queue so a body is reported once per pipeline run', () => {
  const context = lint({ input: { x: withKey({ _js: 'return nope;' }, 'k1') } });
  jsLint.run({ components: {}, context });

  expect(context.jsBodies).toEqual([]);
  expect(context.errors).toHaveLength(1);
});

test('jsLint caches analysed bodies on the context, not across contexts', () => {
  const first = lint({ input: { x: withKey({ _js: 'return unlinked;' }, 'k1') } });
  expect(first.jsLintCache.size).toBe(1);

  const second = createContext();
  expect(second.jsLintCache).toBeUndefined();
});

test('jsLint drains the list it is given rather than the one on the context', () => {
  const context = createContext();
  jsMapParser({
    input: { x: withKey({ _js: 'return unlinked;' }, 'k1') },
    jsMap: {},
    env: 'client',
    context,
  });
  const jsBodies = context.jsBodies;
  // A concurrent JIT build reassigns context.jsBodies while this build runs.
  context.jsBodies = [];
  jsLint.run({ components: {}, context, jsBodies });

  expect(context.errors).toHaveLength(1);
  expect(jsBodies).toEqual([]);
});

test('jsLint names the server as the provider of "payload" used in a client body', () => {
  const context = lint({ input: { x: withKey({ _js: 'return payload.id;' }, 'k1') } });

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    '_js body references "payload", which is not defined, at line 1. "payload" is a server _js parameter, and this body runs on the client. Available: actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user, and the JavaScript standard library.'
  );
  expect(context.errors[0].checkSlug).toBe('js-lint');
});

test('jsLint names the client as the provider of "urlQuery" used in a server body', () => {
  const context = lint({
    input: { x: withKey({ _js: { fn: 'return urlQuery.id;' } }, 'k1') },
    env: 'server',
  });

  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    '_js body references "urlQuery", which is not defined, at line 1. "urlQuery" is a client _js parameter, and this body runs on the server. Available: args, item, lowdefyApp, payload, secret, state, step, user, and the JavaScript standard library.'
  );
});
