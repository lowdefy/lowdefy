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

import buildOperator from './buildOperator.js';
import createScope from './createScope.js';
import getVar from './getVar.js';
import { bindModuleEntry, moduleVar, moduleId } from './moduleHelpers.js';
import { ref, delegatedRef } from './applyRef.js';
import createSynthKeys from './synthKey.js';
import tag from './tag.js';

const loc = { file: 'a.yaml', line: 7 };

describe('getVar — walker resolveVar parity', () => {
  const scope = createScope({ vars: { name: 'x', nul: null, deep: { value: 9 } } });

  test('string form returns the var', () => {
    expect(getVar({ scope, def: 'name', loc })).toBe('x');
  });
  test('string form deep-gets dot paths', () => {
    expect(getVar({ scope, def: 'deep.value', loc })).toBe(9);
  });
  test('string form missing var returns null', () => {
    expect(getVar({ scope, def: 'missing', loc })).toBe(null);
  });
  test('object form uses provided value even when null', () => {
    expect(getVar({ scope, def: { key: 'nul', default: 'd', hasDefault: true }, loc })).toBe(null);
  });
  test('object form missing var uses default', () => {
    expect(getVar({ scope, def: { key: 'missing', default: 'd', hasDefault: true }, loc })).toBe(
      'd'
    );
  });
  test('object form missing var with null default returns null', () => {
    expect(getVar({ scope, def: { key: 'missing', default: null, hasDefault: true }, loc })).toBe(
      null
    );
  });
  test('object form missing var without default returns null', () => {
    expect(getVar({ scope, def: { key: 'missing' }, loc })).toBe(null);
  });
  test('invalid form throws the walker message with location', () => {
    expect(() => getVar({ scope, def: 42, loc })).toThrow(
      '_var operator takes a string or object with "key" field as arguments.'
    );
    expect(() => getVar({ scope, def: { notKey: 'x' }, loc })).toThrow(ConfigError);
  });
});

describe('ref — operation order and error contract', () => {
  test('transformer runs before key pluck (D3 invariant)', async () => {
    const scope = createScope({ file: 'entry.yaml' });
    const output = await ref({
      scope,
      factory: async () => ({ original: true }),
      file: 'b.yaml',
      vars: { v: 1 },
      key: 'added.value',
      transformer: (content, vars) => ({ ...content, added: { value: vars.v } }),
      transformerPath: 't.js',
      ignoreBuildChecks: undefined,
      loc,
    });
    expect(output).toBe(1);
  });

  test('key pluck misses return null', async () => {
    const scope = createScope({});
    const output = await ref({
      scope,
      factory: async () => ({ a: 1 }),
      file: 'b.yaml',
      vars: {},
      key: 'nope',
      transformer: null,
      loc,
    });
    expect(output).toBe(null);
  });

  test('transformer errors wrap in ConfigError with transformer and file', async () => {
    const scope = createScope({});
    await expect(
      ref({
        scope,
        factory: async () => ({}),
        file: 'b.yaml',
        vars: {},
        key: null,
        transformer: () => {
          throw new Error('boom');
        },
        transformerPath: 'transformers/t.js',
        loc,
      })
    ).rejects.toThrow('Error calling transformer "transformers/t.js" from "b.yaml".');
  });

  test('~ignoreBuildChecks propagates to object content and array items', async () => {
    const scope = createScope({});
    const obj = await ref({
      scope,
      factory: async () => ({ a: 1 }),
      file: 'b.yaml',
      vars: {},
      key: null,
      transformer: null,
      ignoreBuildChecks: ['state-refs'],
      loc,
    });
    expect(obj['~ignoreBuildChecks']).toEqual(['state-refs']);
    const arr = await ref({
      scope,
      factory: async () => [{ a: 1 }, 'scalar', { b: 2 }],
      file: 'c.yaml',
      vars: {},
      key: null,
      transformer: null,
      ignoreBuildChecks: true,
      loc,
    });
    expect(arr[0]['~ignoreBuildChecks']).toBe(true);
    expect(arr[2]['~ignoreBuildChecks']).toBe(true);
  });

  test('ConfigError during a ref collects and resolves to null when scope has onError', async () => {
    const errors = [];
    const scope = createScope({ onError: (e) => errors.push(e) });
    const output = await ref({
      scope,
      factory: async () => {
        throw new ConfigError('inner failure');
      },
      file: 'b.yaml',
      vars: {},
      key: null,
      transformer: null,
      loc,
    });
    expect(output).toBe(null);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('inner failure');
  });

  test('non-Config errors are not swallowed', async () => {
    const scope = createScope({ onError: () => {} });
    await expect(
      ref({
        scope,
        factory: async () => {
          throw new TypeError('bug');
        },
        file: 'b.yaml',
        vars: {},
        key: null,
        transformer: null,
        loc,
      })
    ).rejects.toThrow(TypeError);
  });
});

describe('delegatedRef — walker delegation for module/resolver/non-YAML/dynamic refs', () => {
  test('hands a ~l-marked walker node and the call-site state to walkerResolve', async () => {
    const calls = [];
    const scope = createScope({
      file: 'a.yaml',
      refChain: ['lowdefy.yaml', 'a.yaml'],
      vars: { v: 1 },
      refId: 'pages.0',
      sourceRefId: '1',
      walkPath: 'pages.0',
      walkerResolve: (node, site) => {
        calls.push({ node, site });
        return { resolved: true };
      },
    });
    const result = await delegatedRef({
      scope,
      def: { module: 'core', component: 'stamp' },
      sitePath: 'blocks.1',
      refLine: 12,
      loc,
    });
    expect(result).toEqual({ resolved: true });
    expect(calls).toHaveLength(1);
    expect(calls[0].node._ref).toEqual({ module: 'core', component: 'stamp' });
    // The walker reads the ref line from the container's non-enumerable ~l.
    expect(calls[0].node['~l']).toBe(12);
    expect(Object.keys(calls[0].node)).toEqual(['_ref']);
    expect(calls[0].site).toEqual({
      refId: 'pages.0',
      sourceRefId: '1',
      walkPath: 'pages.0.blocks.1',
      file: 'a.yaml',
      refChain: ['lowdefy.yaml', 'a.yaml'],
      vars: { v: 1 },
    });
  });

  test('without walkerResolve collects a ConfigError and resolves to null', async () => {
    const errors = [];
    const scope = createScope({ file: 'a.yaml', onError: (e) => errors.push(e) });
    const result = await delegatedRef({
      scope,
      def: 'data/settings.json',
      sitePath: '',
      refLine: 1,
      loc,
    });
    expect(result).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('walkerResolve');
  });

  test('ConfigErrors thrown by the walker collect through scope.onError', async () => {
    const errors = [];
    const scope = createScope({
      file: 'a.yaml',
      onError: (e) => errors.push(e),
      walkerResolve: () => {
        throw new ConfigError('Circular reference detected.');
      },
    });
    const result = await delegatedRef({ scope, def: { module: 'x' }, refLine: 3, loc });
    expect(result).toBeNull();
    expect(errors[0].message).toBe('Circular reference detected.');
  });
});

describe('buildOperator — walker evaluateBuildOperator parity', () => {
  const scope = createScope({ env: { MY_ENV: 'env-value' } });

  test('_build.if evaluates', () => {
    expect(
      buildOperator({
        scope,
        node: { '_build.if': { test: true, then: 'a', else: 'b' } },
        loc,
      })
    ).toBe('a');
  });
  test('_build.array.concat evaluates', () => {
    expect(buildOperator({ scope, node: { '_build.array.concat': [[1], [2, 3]] }, loc })).toEqual([
      1, 2, 3,
    ]);
  });
  test('_build.array.compact filters null and undefined', () => {
    expect(
      buildOperator({ scope, node: { '_build.array.compact': ['a', null, 'b'] }, loc })
    ).toEqual(['a', 'b']);
  });
  test('_build.env reads scope env', () => {
    expect(buildOperator({ scope, node: { '_build.env': 'MY_ENV' }, loc })).toBe('env-value');
  });
  test('_build.nunjucks templates strings (the blessed string idiom)', () => {
    expect(
      buildOperator({
        scope,
        node: { '_build.nunjucks': { template: '{{ ns }}_upload', on: { ns: 'pdf' } } },
        loc,
      })
    ).toBe('pdf_upload');
  });
  test('operator errors collect with location instead of throwing when scope collects', () => {
    const errors = [];
    const collecting = createScope({ onError: (e) => errors.push(e) });
    const output = buildOperator({
      scope: collecting,
      node: { '_build.array.compact': { on: 'not-an-array' } },
      loc,
    });
    // evaluateOperators resolves a failed operator to null — walker parity.
    expect(output).toBe(null);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('_array.compact takes an array');
    expect(errors[0].filePath).toBe('a.yaml');
  });
});

describe('module helpers — D7 binding semantics', () => {
  test('moduleVar resolves consumer vars over defaults with caching', async () => {
    const binding = bindModuleEntry({
      id: 'files',
      consumerVars: { given: 'consumer' },
      varDefs: { given: { default: 'def' }, fallback: { default: 'def2' }, empty: {} },
    });
    const scope = createScope({ module: binding });
    expect(await moduleVar({ scope, key: 'given', loc })).toBe('consumer');
    expect(await moduleVar({ scope, key: 'fallback', loc })).toBe('def2');
    expect(await moduleVar({ scope, key: 'empty', loc })).toBe(null);
    expect(await moduleVar({ scope, key: 'undeclared', loc })).toBe(null);
  });

  test('moduleVar resolves namespace vars per-leaf', async () => {
    const binding = bindModuleEntry({
      id: 'files',
      consumerVars: { ns: { a: 'consumer-a' } },
      varDefs: { ns: { properties: { a: { default: 'da' }, b: { default: 'db' } } } },
    });
    const scope = createScope({ module: binding });
    expect(await moduleVar({ scope, key: 'ns', loc })).toEqual({ a: 'consumer-a', b: 'db' });
  });

  test('moduleVar outside a module throws', async () => {
    const scope = createScope({});
    await expect(moduleVar({ scope, key: 'x', loc })).rejects.toThrow(
      '_module.var "x" used outside a module'
    );
  });

  test('moduleId string form scopes against the binding', () => {
    const binding = bindModuleEntry({ id: 'files' });
    const scope = createScope({ module: binding });
    expect(moduleId({ scope, kind: 'pageId', arg: 'view', loc })).toBe('files/view');
    // _module.id takes any non-object value and returns the entry id (walker).
    expect(moduleId({ scope, kind: 'id', arg: true, loc })).toBe('files');
    expect(moduleId({ scope, kind: 'id', arg: 'thing', loc })).toBe('files');
  });

  test('moduleId connectionId honors remappings', () => {
    const binding = bindModuleEntry({ id: 'files', connections: { uploads: 'app_uploads' } });
    const scope = createScope({ module: binding });
    expect(moduleId({ scope, kind: 'connectionId', arg: 'uploads', loc })).toBe('app_uploads');
    expect(moduleId({ scope, kind: 'connectionId', arg: 'other', loc })).toBe('files/other');
  });

  test('moduleId string form at app level throws the ambiguity error', () => {
    const scope = createScope({});
    expect(() => moduleId({ scope, kind: 'pageId', arg: 'view', loc })).toThrow(
      '_module.pageId string form is ambiguous at the app level'
    );
  });

  test('moduleId object form resolves dependency targets', () => {
    // deps map names to entry ids; targets come from the build registry.
    const registry = { other: { id: 'other', connections: { c1: 'mapped' } } };
    const binding = bindModuleEntry({ id: 'files', deps: { otherDep: 'other' } });
    const scope = createScope({ module: binding, getModuleEntry: (id) => registry[id] });
    expect(moduleId({ scope, kind: 'pageId', arg: { id: 'p', module: 'otherDep' }, loc })).toBe(
      'other/p'
    );
    expect(
      moduleId({ scope, kind: 'connectionId', arg: { id: 'c1', module: 'otherDep' }, loc })
    ).toBe('mapped');
    expect(() =>
      moduleId({ scope, kind: 'pageId', arg: { id: 'p', module: 'nope' }, loc })
    ).toThrow('references dependency "nope" but no mapping exists');
  });

  test('moduleId invalid arg throws the walker message', () => {
    const scope = createScope({ module: bindModuleEntry({ id: 'm' }) });
    expect(() => moduleId({ scope, kind: 'endpointId', arg: 42, loc })).toThrow(
      '_module.endpointId requires a string or object { id, module }.'
    );
  });
});

describe('tag and synthKey', () => {
  test('tag sets an enumerable ~k on objects and arrays', () => {
    const obj = tag({ a: 1 }, 'f:1');
    expect(obj['~k']).toBe('f:1');
    expect(Object.keys(obj)).toContain('~k');
    const arr = tag([1, 2], 'f:2');
    expect(arr['~k']).toBe('f:2');
  });

  test('synthKey assigns reserved-namespace keys with keyMap entries', () => {
    const keyMap = {};
    const synthKey = createSynthKeys('addDefaultPages');
    const k1 = synthKey(keyMap, 'pages[0:404]');
    const k2 = synthKey(keyMap);
    expect(k1).toBe('gen:addDefaultPages:1');
    expect(k2).toBe('gen:addDefaultPages:2');
    expect(keyMap[k1]).toEqual({ key: 'pages[0:404]', step: 'addDefaultPages' });
  });
});
