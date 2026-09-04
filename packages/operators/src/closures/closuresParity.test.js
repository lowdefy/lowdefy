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

import { ConfigError, shouldSuppressBuildCheck } from '@lowdefy/errors';

import createParityHarness, { normalize } from './test/createParityHarness.js';
import createTestOperators from './test/createTestOperators.js';

const names = [
  '_args',
  '_concat',
  '_error',
  '_misconfigured',
  '_reparse',
  '_state',
  '_string',
  '_sum',
];

const operators = createTestOperators({
  names,
  throwing: ['_error'],
  configErrors: ['_misconfigured'],
  reentrant: ['_reparse'],
});

function parity({ env, input, key = 'root', ...options }) {
  const harness = createParityHarness({ env, operators });
  const tree = normalize(input);
  const { module } = harness.emit(tree);
  const node = harness.findNode(tree, key);
  const closure = module.closures[key];
  expect(closure).toBeDefined();
  return harness.run({ tree: node, closure, ...options });
}

function expectParity(result) {
  expect(result.closure.output).toEqual(result.walker.output);
  expect(result.closure.markers).toEqual(result.walker.markers);
  expect(result.closure.errors).toEqual(result.walker.errors);
}

describe.each(['web', 'server'])('%s closures match the parser', (env) => {
  test('a nested operator tree evaluates bottom-up to the same output', () => {
    const result = parity({
      env,
      input: {
        '~k': 'root',
        a: { _sum: [1, 2, 3], '~k': 'a' },
        b: { c: { _state: 'x', '~k': 'c' }, d: [1, { _string: 'y', '~k': 'd' }], '~k': 'b' },
      },
    });
    expectParity(result);
    expect(result.closure.output).toEqual({
      a: 3,
      b: { c: '_state("x")', d: [1, '_string("y")'] },
    });
  });

  test('an unknown operator passes through as data with its markers', () => {
    const result = parity({
      env,
      input: { '~k': 'root', a: { _unknown: { deep: { _sum: [1, 2], '~k': 'deep' } }, '~k': 'a' } },
    });
    expectParity(result);
    expect(result.closure.output).toEqual({ a: { _unknown: { deep: 2 } } });
    expect(result.closure.markers).toContain('.a:~k=a');
  });

  test('an escaped operator prefix passes through as data', () => {
    const result = parity({
      env,
      input: { '~k': 'root', a: { __sum: [1, 2], '~k': 'a' }, b: { _sum: [1], '~k': 'b' } },
    });
    expectParity(result);
    expect(result.closure.output).toEqual({ a: { __sum: [1, 2] }, b: 1 });
  });

  test('an object with more than one key is data, and its children still evaluate', () => {
    const result = parity({
      env,
      input: {
        '~k': 'root',
        a: { _sum: [1, 2], other: { _sum: [1], '~k': 'other' }, '~k': 'a' },
      },
    });
    expectParity(result);
    expect(result.closure.output).toEqual({ a: { _sum: [1, 2], other: 1 } });
  });

  test('a method operator splits typeName and methodName the same way', () => {
    const result = parity({ env, input: { '~k': 'root', a: { '_string.pad': 'x', '~k': 'a' } } });
    expectParity(result);
    expect(result.closure.output).toEqual({ a: '_string.pad("x")' });
  });

  test('a thrown Error wraps as OperatorError with the evaluated params as received', () => {
    const result = parity({
      env,
      input: { '~k': 'root', a: { _error: { _sum: [1, 2], '~k': 'inner' }, '~k': 'a' } },
    });
    expectParity(result);
    expect(result.closure.output).toEqual({ a: null });
    expect(result.closure.errors).toEqual([
      {
        name: 'OperatorError',
        message: '_error failed. at root.',
        received: { _error: 2 },
        location: 'root',
        configKey: 'a',
        typeName: '_error',
        methodName: null,
      },
    ]);
  });

  test('a thrown ConfigError passes through and gains the site configKey', () => {
    const result = parity({
      env,
      input: { '~k': 'root', a: { _misconfigured: 'p', '~k': 'a' } },
    });
    expectParity(result);
    expect(result.closure.errors[0]).toMatchObject({
      name: 'ConfigError',
      configKey: 'a',
      received: 'p',
    });
  });

  test('every failing site collects an error and yields null in place', () => {
    const result = parity({
      env,
      input: { '~k': 'root', a: { _error: 1, '~k': 'a' }, b: { _error: 2, '~k': 'b' } },
    });
    expectParity(result);
    expect(result.closure.output).toEqual({ a: null, b: null });
    expect(result.closure.errors).toHaveLength(2);
  });

  test('an operator that re-enters the parser gets a real parser', () => {
    const result = parity({
      env,
      input: { '~k': 'root', a: { _reparse: { b: { _sum: [1, 2], '~k': 'b' } }, '~k': 'a' } },
    });
    expectParity(result);
    expect(result.closure.output).toEqual({ a: { _reparse: { b: 2 } } });
  });

  test('a Date survives emission', () => {
    const date = new Date('2026-09-04T00:00:00.000Z');
    const result = parity({
      env,
      input: { '~k': 'root', a: date, b: [date], c: { _sum: [1], '~k': 'c' } },
    });
    expectParity(result);
    expect(result.closure.output.a).toEqual(date);
    expect(result.closure.output.b[0]).toEqual(date);
  });

  test('undefined drops from objects and becomes null in arrays, as JSON does', () => {
    const result = parity({
      env,
      input: { '~k': 'root', a: undefined, b: [undefined, 1], c: { _sum: [1], '~k': 'c' } },
    });
    expectParity(result);
    expect(result.closure.output).toEqual({ b: [null, 1], c: 1 });
  });

  test('each evaluation produces a fresh tree, so nothing is shared between calls', () => {
    const harness = createParityHarness({ env, operators });
    const tree = normalize({ '~k': 'root', a: [{ b: 1 }], c: { _sum: [1], '~k': 'c' } });
    const { module } = harness.emit(tree);
    const node = harness.findNode(tree, 'root');
    const first = harness.run({ tree: node, closure: module.closures.root });
    const second = harness.run({ tree: node, closure: module.closures.root });
    expect(first.closure.output).not.toBe(second.closure.output);
    expect(first.closure.output.a[0]).not.toBe(second.closure.output.a[0]);
    first.closure.output.a[0].b = 99;
    expect(second.closure.output.a[0].b).toBe(1);
  });

  test('a sub-root closure matches the walker parsing that node alone', () => {
    const harness = createParityHarness({ env, operators });
    const tree = normalize({
      '~k': 'root',
      properties: { title: { _state: 'title', '~k': 'title' }, '~k': 'properties' },
    });
    const { module } = harness.emit(tree);
    expect(Object.keys(module.closures).sort()).toEqual(['properties', 'root', 'title']);
    ['root', 'properties', 'title'].forEach((key) => {
      expectParity(
        harness.run({ tree: harness.findNode(tree, key), closure: module.closures[key] })
      );
    });
  });

  test('a root with no operators emits no closure, so the engine falls back to the walker', () => {
    const harness = createParityHarness({ env, operators });
    const tree = normalize({ '~k': 'root', a: { b: 1, '~k': 'a' } });
    const { module } = harness.emit(tree);
    expect(module.closures).toEqual({});
  });
});

describe('web-only contract', () => {
  test('arrayIndices are runtime state: one closure, applied per evaluation', () => {
    const harness = createParityHarness({ env: 'web', operators });
    const tree = normalize({ '~k': 'root', a: { _error: 1, '~k': 'a' } });
    const { module } = harness.emit(tree);
    const node = harness.findNode(tree, 'root');
    const first = harness.run({
      tree: node,
      closure: module.closures.root,
      arrayIndices: [0],
      location: 'block.$.properties',
    });
    const second = harness.run({
      tree: node,
      closure: module.closures.root,
      arrayIndices: [3],
      location: 'block.$.properties',
    });
    expectParity(first);
    expectParity(second);
    expect(first.closure.errors[0].location).toBe('block.0.properties');
    expect(second.closure.errors[0].location).toBe('block.3.properties');
  });

  test('args and event reach operators unchanged', () => {
    const harness = createParityHarness({ env: 'web', operators });
    const tree = normalize({ '~k': 'root', a: { _args: 0, '~k': 'a' } });
    const { module } = harness.emit(tree);
    expectParity(
      harness.run({
        tree: harness.findNode(tree, 'root'),
        closure: module.closures.root,
        args: [{ arg: true }],
        event: { event: true },
        actions: [{ actions: true }],
      })
    );
  });
});

describe('server-only contract', () => {
  test('payload, state, steps and items reach operators unchanged', () => {
    const harness = createParityHarness({ env: 'server', operators });
    const tree = normalize({ '~k': 'root', a: { _args: 0, '~k': 'a' } });
    const { module } = harness.emit(tree);
    expectParity(
      harness.run({
        tree: harness.findNode(tree, 'root'),
        closure: module.closures.root,
        args: [{ arg: true }],
        items: [1],
        payload: { payload: true },
        state: { state: true },
        steps: { steps: true },
      })
    );
  });
});

describe('known parser divergences the emitter reproduces on purpose', () => {
  test('markers are lost on an object with a Date child, because serializer.copy loses them', () => {
    const harness = createParityHarness({ env: 'web', operators });
    const tree = normalize({
      '~k': 'root',
      dated: { at: new Date('2026-09-04T00:00:00.000Z'), '~k': 'dated' },
      a: { _sum: [1], '~k': 'a' },
    });
    expect(tree.dated['~k']).toBe('dated');
    const { module } = harness.emit(tree);
    const result = harness.run({
      tree: harness.findNode(tree, 'root'),
      closure: module.closures.root,
    });
    expectParity(result);
    expect(result.walker.output.dated['~k']).toBeUndefined();
    expect(result.closure.output.dated['~k']).toBeUndefined();
  });
});

describe('~ignoreBuildChecks suppression survives emission', () => {
  // Suppression walks the keyMap's ~k_parent chain from the error's configKey.
  // The emitter stamps each site's ~k as the configKey and re-emits ~k on every
  // data node, so a suppression declared on an ancestor still covers a closure
  // error exactly as it covers a walker error.
  const keyMap = {
    root: { key: 'root' },
    page: { key: 'root.page', '~k_parent': 'root', '~ignoreBuildChecks': ['state-refs'] },
    properties: { key: 'root.page.properties', '~k_parent': 'page' },
    site: { key: 'root.page.properties.title', '~k_parent': 'properties' },
  };

  const suppressed = {
    ...operators,
    _misconfigured: () => {
      throw new ConfigError('_misconfigured is misconfigured.', { checkSlug: 'state-refs' });
    },
  };

  test.each(['web', 'server'])('%s: both engines suppress the same error', (env) => {
    const harness = createParityHarness({ env, operators: suppressed });
    const tree = normalize({
      '~k': 'root',
      page: {
        '~k': 'page',
        properties: { '~k': 'properties', title: { _misconfigured: 'x', '~k': 'site' } },
      },
    });
    const { module } = harness.emit(tree);
    const result = harness.run({
      tree: harness.findNode(tree, 'root'),
      closure: module.closures.root,
    });
    expectParity(result);
    expect(result.closure.errors[0].configKey).toBe('site');
    expect(shouldSuppressBuildCheck(result.closure.errors[0], keyMap)).toBe(true);
    expect(shouldSuppressBuildCheck({ configKey: 'site', checkSlug: 'other' }, keyMap)).toBe(false);
  });

  test.each(['web', 'server'])('%s: output nodes keep the ~k the chain is built on', (env) => {
    const harness = createParityHarness({ env, operators });
    const tree = normalize({
      '~k': 'root',
      page: {
        '~k': 'page',
        properties: { '~k': 'properties', title: { _sum: [1], '~k': 'site' } },
      },
    });
    const { module } = harness.emit(tree);
    const result = harness.run({
      tree: harness.findNode(tree, 'root'),
      closure: module.closures.root,
    });
    expectParity(result);
    expect(result.closure.markers).toEqual([
      ':~k=root',
      '.page:~k=page',
      '.page.properties:~k=properties',
    ]);
  });
});
