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

// D4 closure error-contract gate (S3 stage B): for a corpus of resolved
// config trees, compiled-closure evaluation must match ServerParser.parse
// bit-for-bit — output deep-equal, and every collected error agreeing on
// class, message, typeName, methodName, received, location, and configKey.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConfigError } from '@lowdefy/errors';
import { ServerParser } from '@lowdefy/operators';

import emitOperatorClosures from './emitOperatorClosures.js';
import { evaluateClosures } from '../runtime/evaluateClosures.js';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tmpRoot = path.join(pkgRoot, '.tmp-closures');

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

// A hand-made operator set exercising the full contract surface.
const operators = {
  _state: ({ params, state }) => {
    if (typeof params !== 'string') {
      throw new Error('_state takes a string.');
    }
    return state[params] ?? null;
  },
  _payload: ({ params, payload }) => payload[params] ?? null,
  _sum: ({ params }) => params.reduce((a, b) => a + b, 0),
  _string: ({ methodName, params }) => {
    if (methodName === 'concat') {
      return params.join('');
    }
    throw new Error(`_string.${methodName} is not supported.`);
  },
  _secret: ({ params, secrets }) => secrets[params],
  _throw_config: ({ params }) => {
    throw new ConfigError(`Config problem: ${params}.`);
  },
  _throw_config_keyed: ({ params }) => {
    throw new ConfigError(`Keyed problem: ${params}.`, { configKey: 'preset-key' });
  },
  _boom: () => {
    throw new Error('boom');
  },
};

const envBag = {
  operators,
  location: 'request:test',
  payload: { uid: 'u1' },
  state: { name: 'Ada', count: 2 },
  secrets: { TOKEN: 's3cr3t' },
  env: { NODE_ENV: 'test' },
  user: { id: 'u1' },
};

function setHiddenKey(node, k) {
  Object.defineProperty(node, '~k', {
    value: k,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  return node;
}

async function runBoth(input) {
  const parser = new ServerParser({
    env: envBag.env,
    operators,
    secrets: envBag.secrets,
    user: envBag.user,
  });
  const parserResult = parser.parse({
    input,
    location: envBag.location,
    payload: envBag.payload,
    state: envBag.state,
  });

  const { code } = emitOperatorClosures({ input, operators });
  fs.mkdirSync(tmpRoot, { recursive: true });
  const file = path.join(tmpRoot, `case-${Math.abs(hash(code))}.mjs`);
  fs.writeFileSync(file, code);
  const mod = await import(`${file}?v=${Date.now()}`);
  const closureResult = evaluateClosures({
    closure: mod.default,
    operators,
    location: envBag.location,
    payload: envBag.payload,
    state: envBag.state,
    env: envBag.env,
    secrets: envBag.secrets,
    user: envBag.user,
    parser,
  });
  return { parserResult, closureResult };
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h;
}

function errorProfile(e) {
  return {
    name: e.constructor.name,
    message: e.message,
    typeName: e.typeName ?? null,
    methodName: e.methodName ?? null,
    received: e.received ?? null,
    location: e.location ?? null,
    configKey: e.configKey ?? null,
  };
}

async function expectParity(input) {
  const { parserResult, closureResult } = await runBoth(input);
  expect(closureResult.output).toEqual(parserResult.output);
  expect(closureResult.errors.map(errorProfile)).toEqual(parserResult.errors.map(errorProfile));
  return closureResult;
}

describe('closure evaluation matches ServerParser bit-for-bit', () => {
  test('plain data passes through untouched, freshly constructed', async () => {
    const input = { a: 1, b: [true, 'x', null], nested: { deep: { v: 2 } } };
    const { closureResult } = await runBoth(input);
    expect(closureResult.output).toEqual(input);
    expect(closureResult.output).not.toBe(input);
    expect(closureResult.output.nested).not.toBe(input.nested);
  });

  test('operators evaluate bottom-up with env access', async () => {
    await expectParity({
      greeting: { '_string.concat': ['Hello ', { _state: 'name' }, '!'] },
      total: { _sum: [1, { _state: 'count' }, 3] },
      who: { _payload: 'uid' },
      secret: { _secret: 'TOKEN' },
    });
  });

  test('unknown operators pass through as data', async () => {
    await expectParity({
      keep: { _not_an_operator: { _state: 'name' } },
    });
  });

  test('multi-key objects with an underscore key are data, not operators', async () => {
    await expectParity({ thing: { _state: 'name', other: 1 } });
  });

  test('thrown errors wrap as OperatorError with evaluated received and null in place', async () => {
    const result = await expectParity({
      a: { _boom: { inner: { _state: 'count' } } },
      b: 'still here',
    });
    expect(result.output).toEqual({ a: null, b: 'still here' });
    expect(result.errors[0].received).toEqual({ _boom: { inner: 2 } });
  });

  test('ConfigErrors collect with the site configKey when unset', async () => {
    const node = { _throw_config: 'x' };
    setHiddenKey(node, 'k:42');
    const result = await expectParity({ a: node });
    expect(result.errors[0].configKey).toBe('k:42');
  });

  test('ConfigErrors keep their own configKey', async () => {
    const node = { _throw_config_keyed: 'y' };
    setHiddenKey(node, 'k:42');
    const result = await expectParity({ a: node });
    expect(result.errors[0].configKey).toBe('preset-key');
  });

  test('method operators carry methodName; unsupported methods error with it', async () => {
    await expectParity({ ok: { '_string.concat': ['a', 'b'] } });
    const result = await expectParity({ bad: { '_string.upper': ['a'] } });
    expect(result.errors[0].methodName).toBe('upper');
  });

  test('errors inside arrays and nested operators collect independently', async () => {
    const result = await expectParity({
      list: [{ _boom: 1 }, { _sum: [1, 1] }, { _boom: 2 }],
    });
    expect(result.output.list).toEqual([null, 2, null]);
    expect(result.errors).toHaveLength(2);
  });

  test('operator errors from evaluated operator params: inner error nulls the inner site only', async () => {
    const result = await expectParity({
      outer: { _sum: [1, { _boom: 'inner' }] },
    });
    // The inner site nulls; _sum then receives [1, null] — parser parity.
    expect(result.errors[0].typeName).toBe('_boom');
  });

  test('undefined input evaluates to undefined', async () => {
    const { code } = emitOperatorClosures({ input: undefined, operators });
    expect(code).toContain('undefined');
  });

  test('dates survive emission', async () => {
    const d = new Date('2026-01-02T03:04:05.000Z');
    const { closureResult } = await runBoth({ at: d });
    expect(closureResult.output.at).toEqual(d);
  });

  test('injection-unsafe strings emit safely', async () => {
    await expectParity({
      a: '`${process.exit(1)}`',
      b: '"; throw new Error("x"); //',
      c: { _state: 'name' },
    });
  });
});
