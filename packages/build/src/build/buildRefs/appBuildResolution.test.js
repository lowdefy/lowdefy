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
import { ConfigError } from '@lowdefy/errors';
import { evaluateOperators } from '@lowdefy/operators';
import operators from '@lowdefy/operators-js/operators/build';

import precomputeRuntimeOperators from './precomputeRuntimeOperators.js';
import collectDynamicIdentifiers from '../collectDynamicIdentifiers.js';

const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

// _app resolves at the `_` static prefix, exactly as precomputeRuntimeOperators
// runs it during the build (sourcing lowdefyApp from context.appMeta).
function makeContext(appMeta) {
  return {
    appMeta,
    typesMap: {},
    logger: { warn: jest.fn() },
    errors: [],
    keyMap: {},
    refMap: {},
  };
}

// _build.app resolves at the `_build.` prefix, exactly as the walker runs it
// (evaluateBuildOperator forwards ctx.lowdefyApp).
function evaluateBuild(input, lowdefyApp, env = process.env) {
  return evaluateOperators({
    input,
    operators,
    operatorPrefix: '_build.',
    env,
    lowdefyApp,
    dynamicIdentifiers,
  });
}

describe('_app and _build.app resolve at build', () => {
  test('both names resolve slug to appMeta.slug when set', () => {
    const fromStatic = precomputeRuntimeOperators({
      context: makeContext({ slug: 'my-app' }),
      input: { result: { _app: 'slug' } },
      refDef: { path: 'lowdefy.yaml' },
    });
    expect(fromStatic.result).toBe('my-app');

    const { output, errors } = evaluateBuild(
      { result: { '_build.app': 'slug' } },
      { slug: 'my-app' }
    );
    expect(output.result).toBe('my-app');
    expect(errors).toEqual([]);
  });

  test('both names throw a collected ConfigError when slug is unset', () => {
    const staticContext = makeContext({ slug: null });
    const fromStatic = precomputeRuntimeOperators({
      context: staticContext,
      input: { result: { _app: 'slug' } },
      refDef: { path: 'lowdefy.yaml' },
    });
    expect(fromStatic.result).toBeNull();
    expect(staticContext.errors).toHaveLength(1);
    expect(staticContext.errors[0]).toBeInstanceOf(ConfigError);

    const { output, errors } = evaluateBuild({ result: { '_build.app': 'slug' } }, {});
    expect(output.result).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(ConfigError);
  });

  test('non-slug fields return null when unset, at both names', () => {
    const staticContext = makeContext({ name: null });
    const fromStatic = precomputeRuntimeOperators({
      context: staticContext,
      input: { result: { _app: 'name' } },
      refDef: { path: 'lowdefy.yaml' },
    });
    expect(fromStatic.result).toBeNull();
    expect(staticContext.errors).toEqual([]);

    const { output, errors } = evaluateBuild({ result: { '_build.app': 'name' } }, {});
    expect(output.result).toBeNull();
    expect(errors).toEqual([]);
  });
});

describe('_build.app nested in another _build.* operator', () => {
  test('resolves to a string in time to be a map key', () => {
    const { output, errors } = evaluateBuild(
      {
        map: { '_build.object.fromEntries': [[{ '_build.app': 'slug' }, 'value']] },
      },
      { slug: 'my-app' }
    );
    expect(output.map).toEqual({ 'my-app': 'value' });
    expect(errors).toEqual([]);
  });
});

describe('per-location error collection', () => {
  test('N missing-slug references collect N errors with distinct locations', () => {
    const context = makeContext({ slug: null });
    precomputeRuntimeOperators({
      context,
      input: {
        a: { _app: 'slug', '~l': 11 },
        b: { _app: 'slug', '~l': 22 },
        c: { _app: 'slug', '~l': 33 },
      },
      refDef: { path: 'lowdefy.yaml' },
    });
    expect(context.errors).toHaveLength(3);
    const lines = context.errors.map((error) => error.lineNumber).sort();
    expect(lines).toEqual([11, 22, 33]);
  });
});

describe('nesting behind dynamic context', () => {
  test('_app: slug inside _if/_eq with _state still resolves at build', () => {
    const output = precomputeRuntimeOperators({
      context: makeContext({ slug: 'my-app' }),
      input: {
        result: {
          _if: {
            test: { _eq: [{ _state: 'x' }, 1] },
            then: { _app: 'slug' },
            else: 'no',
          },
        },
      },
      refDef: { path: 'lowdefy.yaml' },
    });
    // The surrounding _if/_eq/_state bubbles up dynamic and is preserved, but
    // the static _app: slug inside resolves to the baked string.
    expect(output.result._if.then).toBe('my-app');
  });

  test('_app: slug behind dynamic context still throws when slug is unset', () => {
    const context = makeContext({ slug: null });
    precomputeRuntimeOperators({
      context,
      input: {
        result: {
          _if: {
            test: { _eq: [{ _state: 'x' }, 1] },
            then: { _app: 'slug' },
            else: 'no',
          },
        },
      },
      refDef: { path: 'lowdefy.yaml' },
    });
    expect(context.errors).toHaveLength(1);
    expect(context.errors[0]).toBeInstanceOf(ConfigError);
  });
});

describe('clean cases', () => {
  test('config that never references slug builds with an unset slug', () => {
    const context = makeContext({ slug: null });
    const output = precomputeRuntimeOperators({
      context,
      input: { result: { _sum: [1, 2, 3] } },
      refDef: { path: 'lowdefy.yaml' },
    });
    expect(output.result).toBe(6);
    expect(context.errors).toEqual([]);
  });
});

describe('_build.env non-regression', () => {
  test('_build.env resolves from env when lowdefyApp is also present', () => {
    const { output, errors } = evaluateBuild(
      { value: { '_build.env': 'APP_BUILD_TEST_VAR' } },
      { slug: 'my-app' },
      { APP_BUILD_TEST_VAR: 'hello' }
    );
    expect(output.value).toBe('hello');
    expect(errors).toEqual([]);
  });
});
