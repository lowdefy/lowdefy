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
import { serializer } from '@lowdefy/helpers';
import operators from '@lowdefy/operators-js/operators/build';

import testContext from '../../test-utils/testContext.js';
import expectTerminates from '../../test-utils/expectTerminates.js';
import collectDynamicIdentifiers from '../collectDynamicIdentifiers.js';
import { resolve, WalkContext } from './walker.js';
import {
  createRecord,
  getPlaceholderId,
  getRecord,
  makePlaceholder,
  makeRecordId,
  resolveDeferred,
} from './deferredRegistry.js';

const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

const mockReadConfigFile = jest.fn();

function createBuildContext() {
  const context = testContext({
    readConfigFile: mockReadConfigFile,
  });
  context.errors = [];
  context.keyMap = context.keyMap ?? {};
  context.unresolvedRefVars = {};
  return context;
}

function createWalkContext({ buildContext, moduleEntry, shouldStop } = {}) {
  const ctx = buildContext ?? createBuildContext();
  return new WalkContext({
    buildContext: ctx,
    refId: 'test:lowdefy.yaml:0',
    sourceRefId: null,
    vars: {},
    moduleEntry: moduleEntry ?? null,
    moduleRoot: moduleEntry?.moduleRoot ?? null,
    packageRoot: moduleEntry?.packageRoot ?? null,
    path: '',
    currentFile: 'lowdefy.yaml',
    refChain: new Set(['lowdefy.yaml']),
    operators,
    env: process.env,
    dynamicIdentifiers,
    shouldStop: shouldStop ?? null,
  });
}

describe('record ids', () => {
  test('derive from entry id and config path', () => {
    expect(makeRecordId({ entryId: 'team-users', configPath: 'components.0.component' })).toBe(
      'team-users:components.0.component'
    );
  });

  test('app-level records use the app prefix', () => {
    expect(makeRecordId({ entryId: null, configPath: 'modules.2.vars.theme' })).toBe(
      'app:modules.2.vars.theme'
    );
  });
});

describe('record lifecycle', () => {
  test('createRecord stores and getRecord returns the record', () => {
    const context = createBuildContext();
    const record = createRecord(context, {
      id: 'team-users:components.0.component',
      kind: 'component',
      body: { type: 'Box' },
      env: { file: '/m/module.lowdefy.yaml', entryId: 'team-users', refId: 'r1' },
    });
    expect(getRecord(context, 'team-users:components.0.component')).toBe(record);
    expect(record.slot).toBeNull();
    expect(record.done).toBe(false);
    expect(record.waitingOn).toEqual(new Set());
  });

  test('duplicate record id throws — one record per config position per build', () => {
    const context = createBuildContext();
    createRecord(context, { id: 'a:x', kind: 'component', body: {}, env: {} });
    expect(() => createRecord(context, { id: 'a:x', kind: 'component', body: {}, env: {} })).toThrow(
      'Deferred record "a:x" already exists'
    );
  });

  test('getRecord throws on a registry miss', () => {
    const context = createBuildContext();
    expect(() => getRecord(context, 'nope:missing')).toThrow(
      'Deferred record "nope:missing" not found'
    );
  });
});

describe('placeholders', () => {
  test('makePlaceholder and getPlaceholderId round-trip', () => {
    const placeholder = makePlaceholder('team-users:components.0.component');
    expect(getPlaceholderId(placeholder)).toBe('team-users:components.0.component');
  });

  test('getPlaceholderId rejects non-placeholder shapes', () => {
    expect(getPlaceholderId(null)).toBeUndefined();
    expect(getPlaceholderId('a:b')).toBeUndefined();
    expect(getPlaceholderId({ '~deferred': 'a:b', extra: 1 })).toBeUndefined();
    expect(getPlaceholderId({ '~deferred': 42 })).toBeUndefined();
    expect(getPlaceholderId({ other: 'a:b' })).toBeUndefined();
  });

  test('placeholders survive serializer.copy as inert one-key objects', () => {
    const placeholder = makePlaceholder('a:x');
    const copied = serializer.copy({ nested: { deep: placeholder } });
    expect(copied.nested.deep).toEqual({ '~deferred': 'a:x' });
    expect(getPlaceholderId(copied.nested.deep)).toBe('a:x');
  });

  test('placeholders survive the serializeToString/deserializeFromString round-trip', () => {
    const placeholder = makePlaceholder('a:x');
    const str = serializer.serializeToString({ list: [placeholder] });
    const back = serializer.deserializeFromString(str);
    expect(getPlaceholderId(back.list[0])).toBe('a:x');
  });
});

describe('walker record:<kind> mode', () => {
  test('record-ifies the matched region and splices in a placeholder', async () => {
    const buildContext = createBuildContext();
    const moduleEntry = { id: 'team-users', moduleRoot: '/m', packageRoot: '/m' };
    const ctx = createWalkContext({
      buildContext,
      moduleEntry,
      shouldStop: (childPath) =>
        /^components\.\d+\.component$/.test(childPath) ? 'record:component' : false,
    });
    const config = {
      components: [{ id: 'badge', component: { type: 'Box', properties: { content: 'hi' } } }],
    };

    const resolved = await resolve(config, ctx);

    const id = 'team-users:components.0.component';
    expect(resolved.components[0].component).toEqual({ '~deferred': id });
    const record = getRecord(buildContext, id);
    expect(record.kind).toBe('component');
    expect(record.body).toEqual({ type: 'Box', properties: { content: 'hi' } });
    expect(record.env).toEqual({
      file: 'lowdefy.yaml',
      moduleRoot: '/m',
      packageRoot: '/m',
      entryId: 'team-users',
      refId: 'test:lowdefy.yaml:0',
    });
    // Body stays untagged, like an in-place preserved body — consumer
    // provenance is applied at consumption time.
    expect(record.body['~r']).toBeUndefined();
  });

  test('per-consumer placeholders pass through later walks untouched', async () => {
    const buildContext = createBuildContext();
    createRecord(buildContext, {
      id: 'team-users:components.0.component',
      kind: 'component',
      body: { type: 'Box' },
      env: {},
    });
    const placeholder = makePlaceholder('team-users:components.0.component');
    const ctx = createWalkContext({ buildContext });
    const resolved = await resolve({ wrapper: placeholder }, ctx);
    expect(resolved.wrapper).toBe(placeholder);
  });

  test('single-value placeholders resolve and splice through the walk', async () => {
    const buildContext = createBuildContext();
    createRecord(buildContext, {
      id: 'team-users:vars.title.default',
      kind: 'varDefault',
      body: { text: 'Default Title' },
      env: {},
    });
    const placeholder = makePlaceholder('team-users:vars.title.default');
    const ctx = createWalkContext({ buildContext });
    const resolved = await resolve({ wrapper: placeholder }, ctx);
    expect(resolved.wrapper).toEqual({ text: 'Default Title' });
    // The spliced value is a clone — the memoized instance stays unshared.
    const record = getRecord(buildContext, 'team-users:vars.title.default');
    expect(resolved.wrapper).not.toBe(record.value);
  });
});

describe('resolveDeferred and the wait-graph', () => {
  const guard = (promise) =>
    expectTerminates(promise, 4000, 'suspected wait-graph cycle-detection regression');

  test('memoizes: the second demand returns the memoized value without re-resolving', async () => {
    const buildContext = createBuildContext();
    createRecord(buildContext, {
      id: 'a:vars.x',
      kind: 'varDefault',
      body: { value: 1 },
      env: {},
    });
    const ctx = createWalkContext({ buildContext });
    const first = await guard(resolveDeferred(ctx, 'a:vars.x'));
    const second = await guard(resolveDeferred(ctx, 'a:vars.x'));
    expect(second).toBe(first);
    expect(getRecord(buildContext, 'a:vars.x').done).toBe(true);
  });

  test('coalesces: concurrent demands of one record resolve it once', async () => {
    const buildContext = createBuildContext();
    createRecord(buildContext, {
      id: 'a:vars.x',
      kind: 'varDefault',
      body: { value: 1 },
      env: {},
    });
    const ctx = createWalkContext({ buildContext });
    const [first, second] = await guard(
      Promise.all([resolveDeferred(ctx, 'a:vars.x'), resolveDeferred(ctx, 'a:vars.x')])
    );
    expect(second).toBe(first);
  });

  test('acyclic chains resolve through nested placeholders', async () => {
    const buildContext = createBuildContext();
    createRecord(buildContext, {
      id: 'a:vars.outer',
      kind: 'varDefault',
      body: { nested: makePlaceholder('a:vars.inner') },
      env: {},
    });
    createRecord(buildContext, {
      id: 'a:vars.inner',
      kind: 'varDefault',
      body: { value: 'leaf' },
      env: {},
    });
    const ctx = createWalkContext({ buildContext });
    const outer = await guard(resolveDeferred(ctx, 'a:vars.outer'));
    expect(outer).toEqual({ nested: { value: 'leaf' } });
  });

  test.each([
    ['a-first', 'a:vars.x', 'b:vars.y'],
    ['b-first', 'b:vars.y', 'a:vars.x'],
  ])('true cycle errors with the named chain (order=%s)', async (_, startId) => {
    const buildContext = createBuildContext();
    createRecord(buildContext, {
      id: 'a:vars.x',
      kind: 'varDefault',
      body: { nested: makePlaceholder('b:vars.y') },
      env: { file: '/a/module.lowdefy.yaml' },
    });
    createRecord(buildContext, {
      id: 'b:vars.y',
      kind: 'varDefault',
      body: { nested: makePlaceholder('a:vars.x') },
      env: { file: '/b/module.lowdefy.yaml' },
    });
    const ctx = createWalkContext({ buildContext });
    await expect(guard(resolveDeferred(ctx, startId))).rejects.toThrow(
      'Circular deferred value dependency:'
    );
  });

  test('concurrent mutual demands error, not deadlock', async () => {
    const buildContext = createBuildContext();
    createRecord(buildContext, {
      id: 'a:vars.x',
      kind: 'varDefault',
      body: { nested: makePlaceholder('b:vars.y') },
      env: {},
    });
    createRecord(buildContext, {
      id: 'b:vars.y',
      kind: 'varDefault',
      body: { nested: makePlaceholder('a:vars.x') },
      env: {},
    });
    const ctx = createWalkContext({ buildContext });
    await expect(
      guard(
        Promise.all([resolveDeferred(ctx, 'a:vars.x'), resolveDeferred(ctx, 'b:vars.y')])
      )
    ).rejects.toThrow('Circular deferred value dependency:');
  });

  test('demands from outside any record add no edges — diamonds are not cycles', async () => {
    const buildContext = createBuildContext();
    createRecord(buildContext, {
      id: 'a:vars.left',
      kind: 'varDefault',
      body: { nested: makePlaceholder('c:vars.shared') },
      env: {},
    });
    createRecord(buildContext, {
      id: 'b:vars.right',
      kind: 'varDefault',
      body: { nested: makePlaceholder('c:vars.shared') },
      env: {},
    });
    createRecord(buildContext, {
      id: 'c:vars.shared',
      kind: 'varDefault',
      body: { value: 'leaf' },
      env: {},
    });
    const ctx = createWalkContext({ buildContext });
    const [left, right] = await guard(
      Promise.all([resolveDeferred(ctx, 'a:vars.left'), resolveDeferred(ctx, 'b:vars.right')])
    );
    expect(left).toEqual({ nested: { value: 'leaf' } });
    expect(right).toEqual({ nested: { value: 'leaf' } });
  });

  test('per-consumer kinds cannot be demanded', async () => {
    const buildContext = createBuildContext();
    createRecord(buildContext, {
      id: 'a:components.0.component',
      kind: 'component',
      body: { type: 'Box' },
      env: {},
    });
    const ctx = createWalkContext({ buildContext });
    await expect(resolveDeferred(ctx, 'a:components.0.component')).rejects.toThrow(
      'resolves per consumer'
    );
  });
});

describe('registry serialization round-trip', () => {
  test('serializeRegistry strips runtime state; hydrate rebuilds it empty', async () => {
    const { serializeRegistry, hydrateDeferredRecords } = await import('./deferredRegistry.js');
    const context = createBuildContext();
    const record = createRecord(context, {
      id: 'team-users:components.0.component',
      kind: 'component',
      body: { type: 'Box' },
      env: { file: '/m/module.lowdefy.yaml', entryId: 'team-users', refId: 'r1' },
    });
    record.done = true;
    record.value = 'runtime-state';
    record.promise = Promise.resolve();

    const str = serializeRegistry(context);
    const hydrated = createBuildContext();
    hydrateDeferredRecords(hydrated, serializer.deserializeFromString(str));

    const back = getRecord(hydrated, 'team-users:components.0.component');
    expect(back.kind).toBe('component');
    expect(back.body).toEqual({ type: 'Box' });
    expect(back.env).toEqual({ file: '/m/module.lowdefy.yaml', entryId: 'team-users', refId: 'r1' });
    expect(back.slot).toBeNull();
    expect(back.done).toBe(false);
    expect(back.value).toBeUndefined();
    expect(back.promise).toBeNull();
    expect(back.waitingOn).toEqual(new Set());
  });

  test('record-body ~l/~r markers survive the artifact round-trip', async () => {
    const { serializeRegistry, hydrateDeferredRecords } = await import('./deferredRegistry.js');
    const setNonEnumerableProperty = (await import('../../utils/setNonEnumerableProperty.js'))
      .default;
    const context = createBuildContext();
    const body = { type: 'Box', properties: { content: 'hi' } };
    setNonEnumerableProperty(body, '~l', 12);
    setNonEnumerableProperty(body, '~r', 'ref_7');
    createRecord(context, {
      id: 'team-users:components.0.component',
      kind: 'component',
      body,
      env: { file: '/m/module.lowdefy.yaml' },
    });

    const str = serializeRegistry(context);
    // Plain JSON parse would keep markers enumerable or drop them; the reviver
    // re-attaches them non-enumerable — assert both value and enumerability.
    const hydrated = createBuildContext();
    hydrateDeferredRecords(hydrated, serializer.deserializeFromString(str));
    const back = getRecord(hydrated, 'team-users:components.0.component');
    expect(back.body['~l']).toBe(12);
    expect(back.body['~r']).toBe('ref_7');
    expect(Object.keys(back.body)).toEqual(['type', 'properties']);
  });
});

describe('varDefault records and the read path', () => {
  const guard = (promise) =>
    expectTerminates(promise, 4000, 'suspected var-default cycle-detection regression');

  function makeEntry({ consumerVars = {}, varDefs = {} } = {}) {
    return {
      id: 'test-module',
      source: 'file:modules/test',
      moduleRoot: '/modules/test',
      packageRoot: '/modules/test',
      consumerVars,
      varDefs,
      resolvedVarCache: {},
      entryConfigState: 'resolved',
      moduleDependencies: {},
    };
  }

  test('deep-force: consumer values with placeholders at depth read fully concrete', async () => {
    const buildContext = createBuildContext();
    createRecord(buildContext, {
      id: 'test-module:vars.logo',
      kind: 'varDefault',
      body: { src: 'logo.png' },
      env: {},
    });
    const moduleEntry = makeEntry({
      consumerVars: {
        theme: { logo: makePlaceholder('test-module:vars.logo'), color: 'red' },
      },
      varDefs: { theme: {} },
    });
    buildContext.modules = { 'test-module': moduleEntry };
    const ctx = createWalkContext({ buildContext, moduleEntry });

    const resolved = await guard(resolve({ value: { '_module.var': 'theme' } }, ctx));

    expect(resolved.value).toEqual({ logo: { src: 'logo.png' }, color: 'red' });
    // The cache holds placeholder-free pure data.
    expect(moduleEntry.resolvedVarCache.theme).toEqual({
      logo: { src: 'logo.png' },
      color: 'red',
    });
  });

  test('object defaults resolve through their varDefault record', async () => {
    const buildContext = createBuildContext();
    createRecord(buildContext, {
      id: 'test-module:vars.title.default',
      kind: 'varDefault',
      body: { text: 'Default Title' },
      env: { entryId: 'test-module', file: '/modules/test/module.lowdefy.yaml' },
    });
    const moduleEntry = makeEntry({
      varDefs: { title: { default: makePlaceholder('test-module:vars.title.default') } },
    });
    buildContext.modules = { 'test-module': moduleEntry };
    const ctx = createWalkContext({ buildContext, moduleEntry });

    const resolved = await guard(resolve({ value: { '_module.var': 'title' } }, ctx));
    expect(resolved.value).toEqual({ text: 'Default Title' });
  });

  test('scalar defaults stay raw in varDefs and resolve without a record', async () => {
    const buildContext = createBuildContext();
    const moduleEntry = makeEntry({ varDefs: { title: { default: 'plain' } } });
    buildContext.modules = { 'test-module': moduleEntry };
    const ctx = createWalkContext({ buildContext, moduleEntry });

    const resolved = await guard(resolve({ value: { '_module.var': 'title' } }, ctx));
    expect(resolved.value).toBe('plain');
  });

  test.each(['a', 'b'])(
    'cyclic defaults error with the named chain instead of overflowing (demand %s first)',
    async (first) => {
      const buildContext = createBuildContext();
      const moduleEntry = makeEntry({
        varDefs: {
          a: { default: makePlaceholder('test-module:vars.a.default') },
          b: { default: makePlaceholder('test-module:vars.b.default') },
        },
      });
      buildContext.modules = { 'test-module': moduleEntry };
      createRecord(buildContext, {
        id: 'test-module:vars.a.default',
        kind: 'varDefault',
        body: { '_module.var': 'b' },
        env: { entryId: 'test-module', file: '/modules/test/module.lowdefy.yaml' },
      });
      createRecord(buildContext, {
        id: 'test-module:vars.b.default',
        kind: 'varDefault',
        body: { '_module.var': 'a' },
        env: { entryId: 'test-module', file: '/modules/test/module.lowdefy.yaml' },
      });
      const ctx = createWalkContext({ buildContext, moduleEntry });

      await expect(
        guard(resolve({ value: { '_module.var': first } }, ctx))
      ).rejects.toThrow('Circular deferred value dependency:');
    }
  );
});
