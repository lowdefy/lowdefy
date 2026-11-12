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

import { ConfigError } from '@lowdefy/errors';
import { expect, test } from 'vitest';

import jsMapParser from './jsMapParser.js';

function setMarker(node, marker, value) {
  Object.defineProperty(node, marker, {
    value,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  return node;
}

function keyed(node) {
  return setMarker(node, '~k', 'key');
}

function getMarker(node, marker) {
  return Object.getOwnPropertyDescriptor(node, marker);
}

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

test('jsMapParser returns the input itself when every node has a ~k and none is a _js', () => {
  const jsMap = {};
  const input = keyed({
    blocks: keyed([keyed({ id: 'a', properties: keyed({ title: 'A' }) })]),
    count: 1,
    none: null,
  });
  const result = jsMapParser({ input, jsMap, env: 'client' });

  expect(result).toBe(input);
  expect(jsMap).toEqual({ client: {} });
});

test('jsMapParser returns undefined and null inputs unchanged', () => {
  const jsMap = {};

  expect(jsMapParser({ input: undefined, jsMap, env: 'client' })).toBeUndefined();
  expect(jsMapParser({ input: null, jsMap, env: 'client' })).toBeNull();
});

test('jsMapParser does not change the input and copies only the nodes above a _js', () => {
  const jsMap = {};
  const sibling = keyed({ id: 'b', properties: keyed({ title: 'B' }) });
  const date = new Date(0);
  const input = keyed({
    blocks: keyed([
      keyed({ id: 'a', properties: keyed({ title: keyed({ _js: 'return 1;' }), date }) }),
      sibling,
    ]),
    events: keyed({ onClick: keyed([keyed({ id: 'c' })]) }),
  });
  const result = jsMapParser({ input, jsMap, env: 'client' });

  expect(input.blocks[0].properties.title).toEqual({ _js: 'return 1;' });
  expect(result).not.toBe(input);
  expect(result.blocks).not.toBe(input.blocks);
  expect(result.blocks[0].properties.title).toEqual({ _js: 'tjmrJIhufQzEpj/iGu5AumDcrBQ=' });
  expect(result.blocks[0].properties.date).toBe(date);
  expect(result.blocks[1]).toBe(sibling);
  expect(result.events).toBe(input.events);
});

test('jsMapParser copies a node that has no ~k and the nodes above it', () => {
  const jsMap = {};
  const roles = keyed(['admin']);
  const auth = { public: false, roles };
  const links = [{ id: 'link', auth }];
  const input = keyed({ id: 'page', auth, menu: keyed({ links }) });
  const result = jsMapParser({ input, jsMap, env: 'client' });

  expect(result).toEqual({
    id: 'page',
    auth: { public: false, roles: ['admin'] },
    menu: { links: [{ id: 'link', auth: { public: false, roles: ['admin'] } }] },
  });
  expect(result).not.toBe(input);
  expect(result.auth).not.toBe(auth);
  expect(result.menu).not.toBe(input.menu);
  expect(result.menu.links).not.toBe(links);
  expect(result.menu.links[0].auth).not.toBe(auth);
  expect(result.menu.links[0].auth).not.toBe(result.auth);
  expect(result.auth.roles).toBe(roles);
  expect(getMarker(result, '~k').value).toBe('key');
  expect(getMarker(result.auth, '~k')).toBeUndefined();
});

test('jsMapParser keeps the ~r and ~l markers of a copied node that has no ~k', () => {
  const jsMap = {};
  const input = setMarker(setMarker({ list: setMarker([1], '~l', 4) }, '~r', 'r1'), '~l', 3);
  const result = jsMapParser({ input, jsMap, env: 'client' });

  expect(result).not.toBe(input);
  expect(getMarker(result, '~r')).toEqual({
    value: 'r1',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  expect(getMarker(result, '~l').value).toBe(3);
  expect(getMarker(result.list, '~l').value).toBe(4);
  expect(getMarker(result.list, '~l').enumerable).toBe(false);
});

test('jsMapParser keeps the ~k, ~r and ~l markers of copied objects and arrays non-enumerable', () => {
  const jsMap = {};
  const blocks = setMarker(
    [setMarker(setMarker({ style: { _js: 'return 1;' } }, '~k', 'k2'), '~l', 7)],
    '~k',
    'k1'
  );
  setMarker(blocks, '~l', 5);
  const input = setMarker(setMarker({ blocks }, '~k', 'k0'), '~r', 'r0');
  const result = jsMapParser({ input, jsMap, env: 'client' });

  expect(result).not.toBe(input);
  expect(getMarker(result, '~k')).toEqual({
    value: 'k0',
    enumerable: false,
    writable: true,
    configurable: true,
  });
  expect(getMarker(result, '~r').value).toBe('r0');
  expect(getMarker(result, '~r').enumerable).toBe(false);
  expect(Array.isArray(result.blocks)).toBe(true);
  expect(getMarker(result.blocks, '~k').value).toBe('k1');
  expect(getMarker(result.blocks, '~k').enumerable).toBe(false);
  expect(getMarker(result.blocks, '~l').value).toBe(5);
  expect(getMarker(result.blocks[0], '~k').value).toBe('k2');
  expect(getMarker(result.blocks[0], '~l').value).toBe(7);
  expect(Object.keys(result)).toEqual(['blocks']);
  expect(Object.keys(result.blocks[0])).toEqual(['style']);
});

test('jsMapParser replaces a _js operator with a node that has no markers', () => {
  const jsMap = {};
  const operator = setMarker(setMarker({ _js: 'return 1;' }, '~k', 'k1'), '~l', 3);
  const fnOperator = setMarker(
    { _js: setMarker({ fn: 'return 2;', args: { a: 1 } }, '~k', 'k3') },
    '~k',
    'k2'
  );
  const result = jsMapParser({ input: { a: operator, b: fnOperator }, jsMap, env: 'client' });

  expect(getMarker(result.a, '~k')).toBeUndefined();
  expect(getMarker(result.a, '~l')).toBeUndefined();
  expect(getMarker(result.b, '~k')).toBeUndefined();
  expect(getMarker(result.b._js, '~k')).toBeUndefined();
  expect(operator).toEqual({ _js: 'return 1;' });
});

test('jsMapParser leaves an object with a _js key beside other keys as it is', () => {
  const jsMap = {};
  const input = { x: { _js: 'return 1;', other: true } };
  const result = jsMapParser({ input, jsMap, env: 'client' });

  expect(result).toEqual({ x: { _js: 'return 1;', other: true } });
  expect(jsMap.client).toEqual({});
});

test('jsMapParser hashes a _js operator whose other keys are undefined', () => {
  const jsMap = {};
  const input = { x: { _js: 'return 1;', other: undefined } };
  const result = jsMapParser({ input, jsMap, env: 'client' });

  expect(Object.keys(result.x)).toEqual(['_js']);
  expect(result.x._js).toBe('tjmrJIhufQzEpj/iGu5AumDcrBQ=');
});

test('jsMapParser leaves a _js key set to undefined as it is', () => {
  const jsMap = {};
  const input = { x: { _js: undefined }, y: { _js: undefined, other: 1 } };
  const result = jsMapParser({ input, jsMap, env: 'client' });

  expect(result).toEqual({ x: {}, y: { other: 1 } });
  expect(jsMap.client).toEqual({});
});

test('jsMapParser hashes _js operators in arrays and keeps the other items', () => {
  const jsMap = {};
  const item = keyed({ id: 'a' });
  const input = { list: [1, 'two', null, item, { _js: 'return 1;' }, [{ _js: 'return 1;' }]] };
  const result = jsMapParser({ input, jsMap, env: 'server' });

  expect(result.list).toEqual([
    1,
    'two',
    null,
    { id: 'a' },
    { _js: 'tjmrJIhufQzEpj/iGu5AumDcrBQ=' },
    [{ _js: 'tjmrJIhufQzEpj/iGu5AumDcrBQ=' }],
  ]);
  expect(result.list[3]).toBe(item);
  expect(jsMap.server).toEqual({ 'tjmrJIhufQzEpj/iGu5AumDcrBQ=': 'return 1;' });
});

test('jsMapParser throws a ConfigError with the configKey of an invalid _js operator', () => {
  const jsMap = {};
  const input = { x: setMarker({ _js: { args: { a: 1 } } }, '~k', 'k1') };

  let thrown;
  try {
    jsMapParser({ input, jsMap, env: 'client' });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ConfigError);
  expect(thrown.configKey).toBe('k1');
  expect(thrown.message).toBe(
    '_js operator expects a JavaScript string or { fn: string, args?: object }. Received {"args":{"a":1}}.'
  );
});

test('jsMapParser reports an invalid _js with its nested _js already hashed', () => {
  const jsMap = {};
  const input = { x: { _js: { args: { inner: { _js: 'return 1;' } } } } };

  expect(() => jsMapParser({ input, jsMap, env: 'client' })).toThrow(
    'Received {"args":{"inner":{"_js":"tjmrJIhufQzEpj/iGu5AumDcrBQ="}}}.'
  );
});
