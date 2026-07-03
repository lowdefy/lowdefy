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
import collectDynamicIdentifiers from '../collectDynamicIdentifiers.js';
import { resolve, WalkContext } from './walker.js';
import {
  createRecord,
  getPlaceholderId,
  getRecord,
  makePlaceholder,
  makeRecordId,
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

  test('single-value placeholders throw until resolveDeferred lands', async () => {
    const buildContext = createBuildContext();
    createRecord(buildContext, {
      id: 'team-users:vars.title.default',
      kind: 'varDefault',
      body: 'Default Title',
      env: {},
    });
    const placeholder = makePlaceholder('team-users:vars.title.default');
    const ctx = createWalkContext({ buildContext });
    await expect(resolve({ wrapper: placeholder }, ctx)).rejects.toThrow(
      'cannot be resolved yet'
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
