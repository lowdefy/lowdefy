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

import path from 'path';

import { jest } from '@jest/globals';

import operators from '@lowdefy/operators-js/operators/build';
import testContext from '../../test-utils/testContext.js';
import { resolve, WalkContext } from './walker.js';
import { getRecord } from './deferredRegistry.js';
import collectDynamicIdentifiers from '../collectDynamicIdentifiers.js';

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

function createWalkContext({ moduleEntry, vars, buildContext } = {}) {
  const ctx = buildContext ?? createBuildContext();
  return new WalkContext({
    buildContext: ctx,
    refId: 'test:lowdefy.yaml:0',
    sourceRefId: null,
    vars: vars ?? {},
    moduleEntry: moduleEntry ?? null,
    moduleRoot: moduleEntry?.moduleRoot ?? null,
    packageRoot: moduleEntry?.packageRoot ?? null,
    path: '',
    currentFile: 'lowdefy.yaml',
    refChain: new Set(['lowdefy.yaml']),
    operators,
    env: process.env,
    dynamicIdentifiers,
    shouldStop: null,
  });
}

function createModuleEntry(consumerVars = {}, varDefs = {}, overrides = {}) {
  return {
    id: overrides.id ?? 'test-module',
    source: overrides.source ?? 'file:modules/test',
    moduleRoot: overrides.moduleRoot ?? '/modules/test',
    packageRoot: overrides.packageRoot ?? '/modules/test',
    consumerVars,
    varDefs,
    resolvedVarCache: {},
    moduleDependencies: overrides.moduleDependencies ?? {},
    refDef:
      overrides.refDef ?? {
        id: 'test:module.lowdefy.yaml:0',
        path: '/modules/test/module.lowdefy.yaml',
      },
    connections: overrides.connections ?? {},
  };
}

beforeEach(() => {
  mockReadConfigFile.mockClear();
});

describe('_module.var resolution', () => {
  test('resolves simple string key from consumerVars', async () => {
    const entry = createModuleEntry({ roles: ['admin', 'editor'] });
    const ctx = createWalkContext({ moduleEntry: entry });
    const node = { '_module.var': 'roles' };
    const result = await resolve(node, ctx);
    expect(result).toEqual(['admin', 'editor']);
  });

  test('resolves nested key path from consumerVars', async () => {
    const entry = createModuleEntry({ components: { table_columns: ['name', 'email'] } });
    const ctx = createWalkContext({ moduleEntry: entry });
    const node = { '_module.var': 'components.table_columns' };
    const result = await resolve(node, ctx);
    expect(result).toEqual(['name', 'email']);
  });

  test('returns null for missing key', async () => {
    const entry = createModuleEntry({ roles: ['admin'] });
    const ctx = createWalkContext({ moduleEntry: entry });
    const node = { '_module.var': 'missing_key' };
    const result = await resolve(node, ctx);
    expect(result).toBeNull();
  });

  test('resolves default from varDefs when consumer omits var', async () => {
    const entry = createModuleEntry({}, { page_size: { default: 25 } });
    const ctx = createWalkContext({ moduleEntry: entry });
    const node = { '_module.var': 'page_size' };
    const result = await resolve(node, ctx);
    expect(result).toBe(25);
  });

  test('consumer value takes precedence over default', async () => {
    const entry = createModuleEntry(
      { page_size: 50 },
      { page_size: { type: 'number', default: 25 } }
    );
    const ctx = createWalkContext({ moduleEntry: entry });
    const node = { '_module.var': 'page_size' };
    const result = await resolve(node, ctx);
    expect(result).toBe(50);
  });

  test('throws when moduleEntry is null and no moduleRoot', async () => {
    const ctx = createWalkContext({ moduleEntry: null });
    const node = { '_module.var': 'roles' };
    await expect(resolve(node, ctx)).rejects.toThrow(
      '_module.var cannot be used at the app level.'
    );
  });

  test('throws when moduleEntry is undefined and no moduleRoot', async () => {
    const ctx = createWalkContext();
    const node = { '_module.var': 'roles' };
    await expect(resolve(node, ctx)).rejects.toThrow(
      '_module.var cannot be used at the app level.'
    );
  });

  test('throws for non-string key', async () => {
    const entry = createModuleEntry({ roles: ['admin'] });
    const ctx = createWalkContext({ moduleEntry: entry });
    const node = { '_module.var': 123 };
    await expect(resolve(node, ctx)).rejects.toThrow(
      '_module.var operator takes a string argument.'
    );
  });

  test('throws for object form', async () => {
    const entry = createModuleEntry({ theme: 'dark' });
    const ctx = createWalkContext({ moduleEntry: entry });
    const node = { '_module.var': { key: 'theme' } };
    await expect(resolve(node, ctx)).rejects.toThrow(
      '_module.var operator takes a string argument.'
    );
  });

  test('deep clones resolved values to prevent mutation', async () => {
    const originalArray = ['admin', 'editor'];
    const entry = createModuleEntry({ roles: originalArray });
    const ctx = createWalkContext({ moduleEntry: entry });
    const node = { '_module.var': 'roles' };
    const result = await resolve(node, ctx);
    expect(result).toEqual(['admin', 'editor']);
    result.push('viewer');
    expect(originalArray).toEqual(['admin', 'editor']);
  });
});

describe('_module.var propagation through WalkContext', () => {
  test('moduleEntry propagates through child()', () => {
    const entry = createModuleEntry({ theme: 'dark' });
    const ctx = createWalkContext({ moduleEntry: entry });
    const child = ctx.child('pages');
    expect(child.moduleEntry).toBe(entry);
  });

  test('moduleEntry propagates through forRef() when not overridden', () => {
    const entry = createModuleEntry({ theme: 'dark' });
    const ctx = createWalkContext({ moduleEntry: entry });
    const refCtx = ctx.forRef({ refId: 'ref:test:1', vars: {}, filePath: 'other.yaml' });
    expect(refCtx.moduleEntry).toBe(entry);
  });

  test('moduleEntry can be overridden in forRef()', () => {
    const entry = createModuleEntry({ theme: 'dark' });
    const newEntry = createModuleEntry({ theme: 'light' }, {}, { id: 'other-module' });
    const ctx = createWalkContext({ moduleEntry: entry });
    const refCtx = ctx.forRef({
      refId: 'ref:test:1',
      vars: {},
      filePath: 'other.yaml',
      moduleEntry: newEntry,
    });
    expect(refCtx.moduleEntry).toBe(newEntry);
  });

  test('_module.var resolves inside nested objects', async () => {
    const entry = createModuleEntry({ title: 'Hello', color: 'blue' });
    const ctx = createWalkContext({ moduleEntry: entry });
    const node = {
      page: {
        title: { '_module.var': 'title' },
        style: {
          color: { '_module.var': 'color' },
        },
      },
    };
    const result = await resolve(node, ctx);
    expect(result).toEqual({
      page: {
        title: 'Hello',
        style: {
          color: 'blue',
        },
      },
    });
  });

  test('_module.var resolves inside arrays', async () => {
    const entry = createModuleEntry({ item1: 'first', item2: 'second' });
    const ctx = createWalkContext({ moduleEntry: entry });
    const node = [{ '_module.var': 'item1' }, { '_module.var': 'item2' }];
    const result = await resolve(node, ctx);
    expect(result).toEqual(['first', 'second']);
  });

  test('_module.var works alongside _var', async () => {
    const entry = createModuleEntry({ moduleTitle: 'Module Title' });
    const ctx = createWalkContext({
      moduleEntry: entry,
      vars: { refTitle: 'Ref Title' },
    });
    const node = {
      fromModule: { '_module.var': 'moduleTitle' },
      fromRef: { _var: 'refTitle' },
    };
    const result = await resolve(node, ctx);
    expect(result).toEqual({
      fromModule: 'Module Title',
      fromRef: 'Ref Title',
    });
  });
});

// --- _module.*Id resolution tests ---

const testModuleEntry = {
  id: 'entry-id',
  connections: {},
  moduleDependencies: {
    events: 'events-entry',
  },
};

const eventsEntry = {
  id: 'events-entry',
  connections: {},
};

const remappedEventsEntry = {
  ...eventsEntry,
  connections: { 'events-db': 'shared-events-mongodb' },
};

function createModuleBuildContext(extraModules = {}) {
  const ctx = createBuildContext();
  ctx.modules = {
    'entry-id': testModuleEntry,
    'events-entry': eventsEntry,
    ...extraModules,
  };
  return ctx;
}

describe('_module.pageId resolution', () => {
  test('string form resolves to scoped page id', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve({ '_module.pageId': 'settings' }, ctx);
    expect(result).toBe('entry-id/settings');
  });

  test('string form returns scoped id without consulting any catalog', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve({ '_module.pageId': 'any-id-at-all' }, ctx);
    expect(result).toBe('entry-id/any-id-at-all');
  });

  test('object form resolves cross-module page', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve(
      { '_module.pageId': { id: 'event-log', module: 'events' } },
      ctx
    );
    expect(result).toBe('events-entry/event-log');
  });

  test('object form returns scoped id without consulting target catalog', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve(
      { '_module.pageId': { id: 'any-id', module: 'events' } },
      ctx
    );
    expect(result).toBe('events-entry/any-id');
  });

  test('throws for unknown dependency', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    await expect(
      resolve({ '_module.pageId': { id: 'x', module: 'unknown' } }, ctx)
    ).rejects.toThrow(
      '_module.pageId { id: "x", module: "unknown" } in module "entry-id" references dependency "unknown" but no mapping exists.'
    );
  });

  test('throws for invalid argument type', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    await expect(resolve({ '_module.pageId': 123 }, ctx)).rejects.toThrow(
      '_module.pageId requires a string or object { id, module }.'
    );
  });
});

describe('_module.connectionId resolution', () => {
  test('string form resolves without remapping', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve({ '_module.connectionId': 'users-db' }, ctx);
    expect(result).toBe('entry-id/users-db');
  });

  test('string form resolves with remapping', async () => {
    const remappedEntry = { ...testModuleEntry, connections: { 'users-db': 'shared-mongodb' } };
    const buildCtx = createBuildContext();
    buildCtx.modules = { 'entry-id': remappedEntry, 'events-entry': eventsEntry };
    const ctx = createWalkContext({ moduleEntry: remappedEntry, buildContext: buildCtx });
    const result = await resolve({ '_module.connectionId': 'users-db' }, ctx);
    expect(result).toBe('shared-mongodb');
  });

  test('string form returns scoped id without consulting any catalog', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve({ '_module.connectionId': 'any-id-at-all' }, ctx);
    expect(result).toBe('entry-id/any-id-at-all');
  });

  test('object form resolves cross-module with target remapping', async () => {
    const buildCtx = createBuildContext();
    buildCtx.modules = {
      'entry-id': testModuleEntry,
      'events-entry': remappedEventsEntry,
    };
    const ctx = createWalkContext({ moduleEntry: testModuleEntry, buildContext: buildCtx });
    const result = await resolve(
      { '_module.connectionId': { id: 'events-db', module: 'events' } },
      ctx
    );
    expect(result).toBe('shared-events-mongodb');
  });

  test('object form resolves cross-module without remapping', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve(
      { '_module.connectionId': { id: 'events-db', module: 'events' } },
      ctx
    );
    expect(result).toBe('events-entry/events-db');
  });
});

describe('_module.endpointId resolution', () => {
  test('string form resolves to scoped endpoint id', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve({ '_module.endpointId': 'invite-user' }, ctx);
    expect(result).toBe('entry-id/invite-user');
  });

  test('string form returns scoped id without consulting any catalog', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve({ '_module.endpointId': 'any-id-at-all' }, ctx);
    expect(result).toBe('entry-id/any-id-at-all');
  });

  test('object form resolves cross-module endpoint', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve(
      { '_module.endpointId': { id: 'send-event', module: 'events' } },
      ctx
    );
    expect(result).toBe('events-entry/send-event');
  });
});

describe('_module.notificationId resolution', () => {
  test('string form resolves to scoped notification id', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve({ '_module.notificationId': 'invite-user' }, ctx);
    expect(result).toBe('entry-id/invite-user');
  });

  test('object form resolves cross-module notification', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve(
      { '_module.notificationId': { id: 'event-digest', module: 'events' } },
      ctx
    );
    expect(result).toBe('events-entry/event-digest');
  });

  test('throws for invalid argument type', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    await expect(resolve({ '_module.notificationId': 7 }, ctx)).rejects.toThrow(
      '_module.notificationId requires a string or object { id, module }.'
    );
  });
});

describe('_module.id resolution', () => {
  test('non-object form returns own module id', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve({ '_module.id': true }, ctx);
    expect(result).toBe('entry-id');
  });

  test('object form returns target module id', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve({ '_module.id': { module: 'events' } }, ctx);
    expect(result).toBe('events-entry');
  });

  test('throws for object without module string', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    await expect(resolve({ '_module.id': { notModule: true } }, ctx)).rejects.toThrow(
      '_module.id requires a truthy value or object { module }.'
    );
  });
});

describe('_module.*Id at app level (null moduleEntry)', () => {
  test('_module.pageId string form throws at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    await expect(resolve({ '_module.pageId': 'settings' }, ctx)).rejects.toThrow(
      '_module.pageId string form is ambiguous at the app level'
    );
  });

  test('_module.connectionId string form throws at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    await expect(resolve({ '_module.connectionId': 'users-db' }, ctx)).rejects.toThrow(
      '_module.connectionId string form is ambiguous at the app level'
    );
  });

  test('_module.endpointId string form throws at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    await expect(resolve({ '_module.endpointId': 'invite-user' }, ctx)).rejects.toThrow(
      '_module.endpointId string form is ambiguous at the app level'
    );
  });

  test('_module.notificationId string form throws at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    await expect(resolve({ '_module.notificationId': 'invite-user' }, ctx)).rejects.toThrow(
      '_module.notificationId string form is ambiguous at the app level'
    );
  });

  test('_module.id non-object form throws at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    await expect(resolve({ '_module.id': true }, ctx)).rejects.toThrow(
      '_module.id is ambiguous at the app level'
    );
  });

  test('_module.pageId object form resolves at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve(
      { '_module.pageId': { id: 'event-log', module: 'events-entry' } },
      ctx
    );
    expect(result).toBe('events-entry/event-log');
  });

  test('_module.connectionId object form resolves at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve(
      { '_module.connectionId': { id: 'events-db', module: 'events-entry' } },
      ctx
    );
    expect(result).toBe('events-entry/events-db');
  });

  test('_module.connectionId object form resolves with remapping at app level', async () => {
    const buildCtx = createBuildContext();
    buildCtx.modules = {
      'entry-id': testModuleEntry,
      'events-entry': remappedEventsEntry,
    };
    const ctx = createWalkContext({ moduleEntry: null, buildContext: buildCtx });
    const result = await resolve(
      { '_module.connectionId': { id: 'events-db', module: 'events-entry' } },
      ctx
    );
    expect(result).toBe('shared-events-mongodb');
  });

  test('_module.endpointId object form resolves at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve(
      { '_module.endpointId': { id: 'send-event', module: 'events-entry' } },
      ctx
    );
    expect(result).toBe('events-entry/send-event');
  });

  test('_module.notificationId object form resolves at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve(
      { '_module.notificationId': { id: 'invite-user', module: 'events-entry' } },
      ctx
    );
    expect(result).toBe('events-entry/invite-user');
  });

  test('_module.id object form resolves at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve(
      { '_module.id': { module: 'events-entry' } },
      ctx
    );
    expect(result).toBe('events-entry');
  });

  test('object form throws for missing module entry at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    await expect(
      resolve({ '_module.pageId': { id: 'page', module: 'nonexistent' } }, ctx)
    ).rejects.toThrow(
      '_module.pageId { id: "page", module: "nonexistent" } references module "nonexistent" but no module with that entry id was registered.'
    );
  });

  test('_module.id object form throws for missing module entry at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    await expect(
      resolve({ '_module.id': { module: 'nonexistent' } }, ctx)
    ).rejects.toThrow(
      '_module.id { module: "nonexistent" } references module "nonexistent" but no module with that entry id was registered.'
    );
  });

  test('_module.var throws at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    await expect(resolve({ '_module.var': 'some-var' }, ctx)).rejects.toThrow(
      '_module.var cannot be used at the app level.'
    );
  });

  test('_module.connectionId object form at app level resolves without consulting target catalog', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve(
      { '_module.connectionId': { id: 'any-connection', module: 'events-entry' } },
      ctx
    );
    expect(result).toBe('events-entry/any-connection');
  });
});

describe('_module.*Id nested in tree', () => {
  test('resolves operators at multiple depths', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const node = {
      level1: {
        page: { '_module.pageId': 'settings' },
        level2: {
          conn: { '_module.connectionId': 'users-db' },
          endpoint: { '_module.endpointId': 'invite-user' },
        },
      },
      modId: { '_module.id': true },
    };
    const result = await resolve(node, ctx);
    expect(result).toEqual({
      level1: {
        page: 'entry-id/settings',
        level2: {
          conn: 'entry-id/users-db',
          endpoint: 'entry-id/invite-user',
        },
      },
      modId: 'entry-id',
    });
  });
});

describe('_module.*Id with operator arguments (bottom-up)', () => {
  test('_module.pageId with _var argument', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      vars: { targetPage: 'settings' },
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve({ '_module.pageId': { _var: 'targetPage' } }, ctx);
    expect(result).toBe('entry-id/settings');
  });

  test('_module.pageId object form with _var in id field', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      vars: { pageArg: 'event-log' },
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve(
      { '_module.pageId': { id: { _var: 'pageArg' }, module: 'events' } },
      ctx
    );
    expect(result).toBe('events-entry/event-log');
  });

  test('_module.connectionId with _var and remapping', async () => {
    const remappedEntry = { ...testModuleEntry, connections: { 'users-db': 'shared-mongodb' } };
    const buildCtx = createBuildContext();
    buildCtx.modules = { 'entry-id': remappedEntry, 'events-entry': eventsEntry };
    const ctx = createWalkContext({
      moduleEntry: remappedEntry,
      vars: { connName: 'users-db' },
      buildContext: buildCtx,
    });
    const result = await resolve({ '_module.connectionId': { _var: 'connName' } }, ctx);
    expect(result).toBe('shared-mongodb');
  });

  test('_module.endpointId with _build.string.concat', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve(
      { '_module.endpointId': { '_build.string.concat': ['invite', '-user'] } },
      ctx
    );
    expect(result).toBe('entry-id/invite-user');
  });
});

describe('_var with computed name (bottom-up)', () => {
  test('_var with _build.string.concat computes variable name', async () => {
    const ctx = createWalkContext({
      vars: { targetPage: 'the-value' },
    });
    const result = await resolve({ _var: { '_build.string.concat': ['target', 'Page'] } }, ctx);
    expect(result).toBe('the-value');
  });

  test('_var with nested _var computes variable name', async () => {
    const ctx = createWalkContext({
      vars: { varName: 'targetPage', targetPage: 'resolved-value' },
    });
    const result = await resolve({ _var: { _var: 'varName' } }, ctx);
    expect(result).toBe('resolved-value');
  });

  test('_var with computed name that misses returns null', async () => {
    const ctx = createWalkContext({
      vars: { which: 'fallback' },
    });
    const result = await resolve({ _var: { _var: 'which' } }, ctx);
    expect(result).toBeNull();
  });
});

describe('_var object form with operator in default (bottom-up)', () => {
  test('_build.string.concat in default resolves during child walking', async () => {
    const ctx = createWalkContext({ vars: {} });
    const result = await resolve(
      { _var: { key: 'missing', default: { '_build.string.concat': ['fall', 'back'] } } },
      ctx
    );
    expect(result).toBe('fallback');
  });

  test('_module.pageId in default resolves during child walking', async () => {
    const ctx = createWalkContext({
      vars: {},
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve(
      { _var: { key: 'missing', default: { '_module.pageId': 'settings' } } },
      ctx
    );
    expect(result).toBe('entry-id/settings');
  });
});

describe('_var reserved key handling', () => {
  test('{ _var: "constructor" } (string form) throws a ConfigError naming the key', async () => {
    const ctx = createWalkContext({ vars: {} });
    const result = await resolve({ _var: 'constructor' }, ctx);
    expect(result).toBeNull();
    expect(ctx.buildContext.errors).toHaveLength(1);
    expect(ctx.buildContext.errors[0].name).toBe('ConfigError');
    expect(ctx.buildContext.errors[0].message).toBe('_var key "constructor" is a reserved name.');
  });

  test('{ _var: { key: "__proto__", default: 1 } } (object form) throws a ConfigError naming the key, not the default', async () => {
    const ctx = createWalkContext({ vars: {} });
    const result = await resolve({ _var: { key: '__proto__', default: 1 } }, ctx);
    expect(result).toBeNull();
    expect(ctx.buildContext.errors).toHaveLength(1);
    expect(ctx.buildContext.errors[0].message).toBe('_var key "__proto__" is a reserved name.');
  });

  test('regression: { _var: { key: "missing", default: 1 } } still returns the default', async () => {
    const ctx = createWalkContext({ vars: {} });
    const result = await resolve({ _var: { key: 'missing', default: 1 } }, ctx);
    expect(result).toBe(1);
    expect(ctx.buildContext.errors).toEqual([]);
  });

  test('regression: { _var: { key: "provided", default: "fallback" } } with a null value returns null, not the default', async () => {
    const ctx = createWalkContext({ vars: { provided: null } });
    const result = await resolve({ _var: { key: 'provided', default: 'fallback' } }, ctx);
    expect(result).toBeNull();
    expect(ctx.buildContext.errors).toEqual([]);
  });
});

describe('_module.var with computed name (bottom-up)', () => {
  test('_build.string.concat computes module variable name', async () => {
    const entry = createModuleEntry({ theme: 'dark' });
    const ctx = createWalkContext({ moduleEntry: entry });
    const result = await resolve(
      { '_module.var': { '_build.string.concat': ['the', 'me'] } },
      ctx
    );
    expect(result).toBe('dark');
  });

  test('_var computes module variable name', async () => {
    const entry = createModuleEntry({ theme: 'dark' });
    const ctx = createWalkContext({
      vars: { whichVar: 'theme' },
      moduleEntry: entry,
    });
    const result = await resolve({ '_module.var': { _var: 'whichVar' } }, ctx);
    expect(result).toBe('dark');
  });
});

describe('_module.var lazy resolution', () => {
  test('caches resolved values across multiple lookups', async () => {
    const entry = createModuleEntry({ color: 'blue' }, { color: { type: 'string' } });
    const ctx = createWalkContext({ moduleEntry: entry });
    await resolve({ '_module.var': 'color' }, ctx);
    await resolve({ '_module.var': 'color' }, ctx);
    expect(entry.resolvedVarCache['color']).toBe('blue');
  });

  test('resolves namespace var by merging consumer + defaults', async () => {
    const entry = createModuleEntry(
      { ui: { show_header: false } },
      {
        ui: {
          type: 'object',
          properties: {
            show_header: { type: 'boolean', default: true },
            page_size: { type: 'number', default: 10 },
          },
        },
      }
    );
    const ctx = createWalkContext({ moduleEntry: entry });
    const result = await resolve({ '_module.var': 'ui' }, ctx);
    expect(result).toEqual({ show_header: false, page_size: 10 });
  });

  test('namespace var uses all defaults when consumer omits it', async () => {
    const entry = createModuleEntry(
      {},
      {
        ui: {
          type: 'object',
          properties: {
            show_header: { type: 'boolean', default: true },
            page_size: { type: 'number', default: 10 },
          },
        },
      }
    );
    const ctx = createWalkContext({ moduleEntry: entry });
    const result = await resolve({ '_module.var': 'ui' }, ctx);
    expect(result).toEqual({ show_header: true, page_size: 10 });
  });

  test('namespace var uses all defaults when consumer provides null', async () => {
    const entry = createModuleEntry(
      { ui: null },
      {
        ui: {
          type: 'object',
          properties: {
            show_header: { type: 'boolean', default: true },
          },
        },
      }
    );
    const ctx = createWalkContext({ moduleEntry: entry });
    const result = await resolve({ '_module.var': 'ui' }, ctx);
    expect(result).toEqual({ show_header: true });
  });

  test('errors on _module.var in module scope without an entry (module-static positions)', async () => {
    const buildContext = createBuildContext();
    const ctx = new WalkContext({
      buildContext,
      refId: 'test:module.yaml:0',
      sourceRefId: null,
      vars: {},
      moduleRoot: '/modules/test',
      packageRoot: '/modules/test',
      path: '',
      currentFile: '/modules/test/module.lowdefy.yaml',
      refChain: new Set(),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });
    // Manifest headers and export ids walk without a module entry — they are
    // module-static, so _module.var there is a ConfigError, not a pass-through.
    const node = { '_module.var': 'theme' };
    await expect(resolve(node, ctx)).rejects.toThrow(
      '_module.var cannot be used in manifest headers or component/menu ids'
    );
  });
});

describe('regression — existing compositions still work', () => {
  test('_build.string.concat with _var argument', async () => {
    const ctx = createWalkContext({ vars: { prefix: 'admin' } });
    const result = await resolve(
      { '_build.string.concat': [{ _var: 'prefix' }, '-page'] },
      ctx
    );
    expect(result).toBe('admin-page');
  });

  test('_var with complex value returns value unchanged', async () => {
    const ctx = createWalkContext({ vars: { config: { nested: true } } });
    const result = await resolve({ _var: 'config' }, ctx);
    expect(result).toEqual({ nested: true });
  });
});

describe('_module.*Id propagation through WalkContext', () => {
  test('moduleEntry propagates through child()', () => {
    const ctx = createWalkContext({ moduleEntry: testModuleEntry });
    const child = ctx.child('pages');
    expect(child.moduleEntry).toBe(testModuleEntry);
  });

  test('moduleEntry propagates through forRef() when not overridden', () => {
    const ctx = createWalkContext({ moduleEntry: testModuleEntry });
    const refCtx = ctx.forRef({ refId: 'ref:test:1', vars: {}, filePath: 'other.yaml' });
    expect(refCtx.moduleEntry).toBe(testModuleEntry);
  });

  test('moduleEntry can be overridden in forRef()', () => {
    const ctx = createWalkContext({ moduleEntry: testModuleEntry });
    const refCtx = ctx.forRef({
      refId: 'ref:test:1',
      vars: {},
      filePath: 'other.yaml',
      moduleEntry: eventsEntry,
    });
    expect(refCtx.moduleEntry).toBe(eventsEntry);
  });
});

describe('moduleRoot propagation through WalkContext', () => {
  test('moduleRoot propagates through child()', () => {
    const ctx = new WalkContext({
      buildContext: createBuildContext(),
      refId: 'test:mod:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: '/modules/dash/module.lowdefy.yaml',
      moduleRoot: '/modules/dash',
      packageRoot: '/modules/dash',
      refChain: new Set(),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });
    const child = ctx.child('pages');
    expect(child.moduleRoot).toBe('/modules/dash');
  });

  test('moduleRoot propagates through forRef() when not overridden', () => {
    const ctx = new WalkContext({
      buildContext: createBuildContext(),
      refId: 'test:mod:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: '/modules/dash/module.lowdefy.yaml',
      moduleRoot: '/modules/dash',
      packageRoot: '/modules/dash',
      refChain: new Set(),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });
    const refCtx = ctx.forRef({ refId: 'ref:test:1', vars: {}, filePath: 'other.yaml' });
    expect(refCtx.moduleRoot).toBe('/modules/dash');
  });

  test('moduleRoot can be overridden in forRef()', () => {
    const ctx = new WalkContext({
      buildContext: createBuildContext(),
      refId: 'test:mod:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: '/modules/dash/module.lowdefy.yaml',
      moduleRoot: '/modules/dash',
      packageRoot: '/modules/dash',
      refChain: new Set(),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });
    const refCtx = ctx.forRef({
      refId: 'ref:test:1',
      vars: {},
      filePath: '/modules/other/page.yaml',
      moduleRoot: '/modules/other',
    });
    expect(refCtx.moduleRoot).toBe('/modules/other');
  });
});

describe('module path resolution stores absolute path in refMap', () => {
  test('refMap stores absolute path for _ref inside a module with packageRoot', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};
    const moduleRoot = '/modules/dashboard';

    mockReadConfigFile.mockImplementation((filePath) => {
      if (filePath === '/modules/dashboard/pages/overview.yaml') {
        return { id: 'overview', type: 'Box' };
      }
      return null;
    });

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:module.lowdefy.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: '/modules/dashboard/module.lowdefy.yaml',
      moduleRoot,
      packageRoot: moduleRoot,
      refChain: new Set(['/modules/dashboard/module.lowdefy.yaml']),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { _ref: 'pages/overview.yaml' };
    await resolve(node, ctx);

    // Find the refMap entry for the resolved _ref
    const refEntry = Object.values(buildContext.refMap).find(
      (entry) => entry.path === '/modules/dashboard/pages/overview.yaml'
    );
    expect(refEntry).toBeDefined();
  });

  test('nested file _ref resolves from moduleRoot, not from the file directory', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};

    mockReadConfigFile.mockImplementation((filePath) => {
      if (filePath === '/modules/dashboard/shared/stat-card.yaml') {
        return { id: 'stat', type: 'Box' };
      }
      return null;
    });

    // currentFile is in a subdirectory of moduleRoot — this is the scenario
    // where the old path.dirname(currentFile) behavior would produce a wrong path.
    const ctx = new WalkContext({
      buildContext,
      refId: 'test:overview.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: '/modules/dashboard/pages/overview.yaml',
      moduleRoot: '/modules/dashboard',
      packageRoot: '/modules/dashboard',
      refChain: new Set(['/modules/dashboard/pages/overview.yaml']),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { _ref: 'shared/stat-card.yaml' };
    await resolve(node, ctx);

    // Should resolve from moduleRoot: /modules/dashboard/shared/stat-card.yaml
    // NOT from currentFile dir: /modules/dashboard/pages/shared/stat-card.yaml
    const refEntry = Object.values(buildContext.refMap).find(
      (entry) => entry.path === '/modules/dashboard/shared/stat-card.yaml'
    );
    expect(refEntry).toBeDefined();
  });

  test('deeply nested file _ref resolves from moduleRoot', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};

    mockReadConfigFile.mockImplementation((filePath) => {
      if (filePath === '/modules/app/components/button.yaml') {
        return { id: 'btn', type: 'Button' };
      }
      return null;
    });

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:form.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: '/modules/app/pages/settings/forms/form.yaml',
      moduleRoot: '/modules/app',
      packageRoot: '/modules/app',
      refChain: new Set(['/modules/app/pages/settings/forms/form.yaml']),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { _ref: 'components/button.yaml' };
    await resolve(node, ctx);

    const refEntry = Object.values(buildContext.refMap).find(
      (entry) => entry.path === '/modules/app/components/button.yaml'
    );
    expect(refEntry).toBeDefined();
  });

  test('module _ref path escaping throws with moduleRoot resolution', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:page.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: '/modules/app/pages/page.yaml',
      moduleRoot: '/modules/app',
      packageRoot: '/modules/app',
      refChain: new Set(['/modules/app/pages/page.yaml']),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { _ref: '../escape.yaml' };
    await expect(resolve(node, ctx)).rejects.toThrow('escapes the package root');
  });

  test('_ref without moduleRoot does not apply module path resolution', async () => {
    const buildContext = createBuildContext();

    mockReadConfigFile.mockImplementation((filePath) => {
      if (filePath === 'components/header.yaml') {
        return { id: 'header', type: 'Box' };
      }
      return null;
    });

    // Standard app context: no moduleRoot, no packageRoot
    const ctx = new WalkContext({
      buildContext,
      refId: 'test:lowdefy.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: 'lowdefy.yaml',
      refChain: new Set(['lowdefy.yaml']),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { _ref: 'components/header.yaml' };
    await resolve(node, ctx);

    // Path should be passed through as-is (resolved by readConfigFile from config root)
    const refEntry = Object.values(buildContext.refMap).find(
      (entry) => entry.path === 'components/header.yaml'
    );
    expect(refEntry).toBeDefined();
  });
});

describe('module ref JS path resolution (resolver / transformer / .js content)', () => {
  // Absolute path to the shipped test-util resolver/transformer files. Using
  // this as moduleRoot lets the walker rewrite produce a path the loader can
  // actually import, exercising the end-to-end behavior.
  const jsModuleRoot = path.resolve('src/test-utils/buildRefs');

  test('module ref rewrites relative resolver against moduleRoot', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:module.lowdefy.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: path.join(jsModuleRoot, 'module.lowdefy.yaml'),
      moduleRoot: jsModuleRoot,
      packageRoot: jsModuleRoot,
      refChain: new Set([path.join(jsModuleRoot, 'module.lowdefy.yaml')]),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = {
      _ref: { resolver: 'testBuildRefsResolver.js', path: 'target', vars: { var: 'v1' } },
    };
    const res = await resolve(node, ctx);

    expect(buildContext.errors).toEqual([]);
    // refDef.path was rewritten by the walker against moduleRoot before the
    // resolver received it. The resolver call confirms the rewritten resolver
    // path was loaded successfully — if it weren't, the import would have
    // failed and no result would be returned.
    expect(res).toEqual({
      resolved: true,
      path: path.resolve(jsModuleRoot, 'target'),
      vars: { var: 'v1' },
      stage: 'test',
    });
  });

  test('module ref rewrites relative transformer against moduleRoot', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};

    mockReadConfigFile.mockImplementation((filePath) => {
      if (filePath === path.join(jsModuleRoot, 'target.yaml')) {
        return 'a: 1';
      }
      return null;
    });

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:module.lowdefy.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: path.join(jsModuleRoot, 'module.lowdefy.yaml'),
      moduleRoot: jsModuleRoot,
      packageRoot: jsModuleRoot,
      refChain: new Set([path.join(jsModuleRoot, 'module.lowdefy.yaml')]),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = {
      _ref: {
        path: 'target.yaml',
        transformer: 'testBuildRefsTransform.js',
        vars: { var1: 'v1' },
      },
    };
    const res = await resolve(node, ctx);

    expect(buildContext.errors).toEqual([]);
    expect(res).toEqual({
      json: '{"a":1}',
      add: 43,
      var: 'v1',
    });
  });

  test('module ref loads .js content from moduleRoot', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:module.lowdefy.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: path.join(jsModuleRoot, 'module.lowdefy.yaml'),
      moduleRoot: jsModuleRoot,
      packageRoot: jsModuleRoot,
      refChain: new Set([path.join(jsModuleRoot, 'module.lowdefy.yaml')]),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { _ref: 'testBuildRefsAsyncFunction.js' };
    const res = await resolve(node, ctx);

    expect(buildContext.errors).toEqual([]);
    // For .js content refs, getRefContent returns the imported default export
    // directly — the function itself. Verify it was loaded by calling it.
    expect(typeof res).toBe('function');
    await expect(res()).resolves.toEqual({ async: true });
  });

  test('app-level resolver path is not rewritten (no moduleRoot)', async () => {
    const buildContext = createBuildContext();

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:lowdefy.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: 'lowdefy.yaml',
      refChain: new Set(['lowdefy.yaml']),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = {
      _ref: { resolver: 'src/test-utils/buildRefs/testBuildRefsResolver.js', path: 'target' },
    };
    const res = await resolve(node, ctx);

    expect(buildContext.errors).toEqual([]);
    expect(res).toEqual({
      resolved: true,
      path: 'target',
      vars: {},
      stage: 'test',
    });
  });

  test('absolute resolver path is honored verbatim inside a module', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};

    const absResolver = path.resolve(jsModuleRoot, 'testBuildRefsResolver.js');

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:module.lowdefy.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: path.join(jsModuleRoot, 'module.lowdefy.yaml'),
      moduleRoot: jsModuleRoot,
      packageRoot: jsModuleRoot,
      refChain: new Set([path.join(jsModuleRoot, 'module.lowdefy.yaml')]),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { _ref: { resolver: absResolver, path: 'target' } };
    const res = await resolve(node, ctx);

    expect(buildContext.errors).toEqual([]);
    // refDef.path is also rewritten against moduleRoot for module refs.
    expect(res).toEqual({
      resolved: true,
      path: path.resolve(jsModuleRoot, 'target'),
      vars: {},
      stage: 'test',
    });
  });

  test('absolute transformer path is honored verbatim inside a module', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};

    mockReadConfigFile.mockImplementation((filePath) => {
      if (filePath === path.join(jsModuleRoot, 'target.yaml')) {
        return 'a: 1';
      }
      return null;
    });

    const absTransformer = path.resolve(jsModuleRoot, 'testBuildRefsTransform.js');

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:module.lowdefy.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: path.join(jsModuleRoot, 'module.lowdefy.yaml'),
      moduleRoot: jsModuleRoot,
      packageRoot: jsModuleRoot,
      refChain: new Set([path.join(jsModuleRoot, 'module.lowdefy.yaml')]),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = {
      _ref: { path: 'target.yaml', transformer: absTransformer, vars: { var1: 'v1' } },
    };
    const res = await resolve(node, ctx);

    expect(buildContext.errors).toEqual([]);
    expect(res).toEqual({ json: '{"a":1}', add: 43, var: 'v1' });
  });

  test('global context.refResolver stays anchored to app config dir, not moduleRoot', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};
    // Global default lives on the build context — must resolve from the host
    // app's config directory regardless of where the consuming ref originates.
    buildContext.refResolver = 'src/test-utils/buildRefs/testBuildRefsResolver.js';

    // Use a moduleRoot that does NOT contain the resolver file. If the walker
    // were to (incorrectly) rewrite context.refResolver against moduleRoot,
    // the loader would fail to find it and the resolver would not run.
    const someUnrelatedModuleRoot = path.resolve('src/test-utils');

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:module.lowdefy.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: path.join(someUnrelatedModuleRoot, 'module.lowdefy.yaml'),
      moduleRoot: someUnrelatedModuleRoot,
      packageRoot: someUnrelatedModuleRoot,
      refChain: new Set([path.join(someUnrelatedModuleRoot, 'module.lowdefy.yaml')]),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { _ref: 'target' };
    const res = await resolve(node, ctx);

    expect(buildContext.errors).toEqual([]);
    expect(res).toEqual({
      resolved: true,
      path: path.resolve(someUnrelatedModuleRoot, 'target'),
      vars: {},
      stage: 'test',
    });
  });

  test('module ref resolver escaping the package root throws', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:page.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: '/modules/app/pages/page.yaml',
      moduleRoot: '/modules/app',
      packageRoot: '/modules/app',
      refChain: new Set(['/modules/app/pages/page.yaml']),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { _ref: { resolver: '../escape.js', path: 'target' } };
    await expect(resolve(node, ctx)).rejects.toThrow(
      /Module ref resolver ".*escape\.js" escapes the package root\./
    );
  });

  test('module ref transformer escaping the package root throws', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:page.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: '/modules/app/pages/page.yaml',
      moduleRoot: '/modules/app',
      packageRoot: '/modules/app',
      refChain: new Set(['/modules/app/pages/page.yaml']),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { _ref: { path: 'target.yaml', transformer: '../escape.js' } };
    await expect(resolve(node, ctx)).rejects.toThrow(
      /Module ref transformer ".*escape\.js" escapes the package root\./
    );
  });

  test('absolute resolver outside the package root throws', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:page.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: '/modules/app/pages/page.yaml',
      moduleRoot: '/modules/app',
      packageRoot: '/modules/app',
      refChain: new Set(['/modules/app/pages/page.yaml']),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { _ref: { resolver: '/elsewhere/evil.js', path: 'target' } };
    await expect(resolve(node, ctx)).rejects.toThrow(
      'Module ref resolver "/elsewhere/evil.js" escapes the package root.'
    );
  });

  test('absolute transformer outside the package root throws', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:page.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: '/modules/app/pages/page.yaml',
      moduleRoot: '/modules/app',
      packageRoot: '/modules/app',
      refChain: new Set(['/modules/app/pages/page.yaml']),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { _ref: { path: 'target.yaml', transformer: '/elsewhere/evil.js' } };
    await expect(resolve(node, ctx)).rejects.toThrow(
      'Module ref transformer "/elsewhere/evil.js" escapes the package root.'
    );
  });

  test('regression: module ref path escape message wording is unchanged', async () => {
    const buildContext = createBuildContext();
    buildContext.modules = {};

    const ctx = new WalkContext({
      buildContext,
      refId: 'test:page.yaml:0',
      sourceRefId: null,
      vars: {},
      path: '',
      currentFile: '/modules/app/pages/page.yaml',
      moduleRoot: '/modules/app',
      packageRoot: '/modules/app',
      refChain: new Set(['/modules/app/pages/page.yaml']),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { _ref: '../escape.yaml' };
    await expect(resolve(node, ctx)).rejects.toThrow(
      'Module ref path "/modules/escape.yaml" escapes the package root.'
    );
  });
});

describe('deferModuleRefs record deferral', () => {
  test('resolving a cross-module _ref with deferModuleRefs true returns an entryRef record placeholder', async () => {
    const buildContext = createBuildContext();
    // Give the refMap an entry for the ref id that will be created
    buildContext.refMap = {};
    const ctx = new WalkContext({
      buildContext,
      refId: 'entry:lowdefy.yaml:0',
      sourceRefId: null,
      vars: {},
      moduleEntry: null,
      moduleRoot: null,
      packageRoot: null,
      path: '',
      currentFile: 'lowdefy.yaml',
      refChain: new Set(['lowdefy.yaml']),
      deferModuleRefs: true,
      entryId: 'consumer-entry',
      entrySection: 'consumerVars',
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { slot: { _ref: { module: 'my-module', component: 'MyComponent' } } };

    const resolved = await resolve(node, ctx);

    // The tree holds an enumerable placeholder; the prepared refDef is the
    // record body and the env replaces ~deferredFrom with explicit provenance.
    const id = 'consumer-entry:consumerVars.slot';
    expect(resolved.slot).toEqual({ '~deferred': id });
    const record = getRecord(buildContext, id);
    expect(record.kind).toBe('entryRef');
    expect(record.body.module).toBe('my-module');
    expect(record.body.component).toBe('MyComponent');
    expect(record.env.file).toBe('lowdefy.yaml');
    expect(record.env.entryId).toBeNull();
    expect(record.slot).toEqual({
      entryId: 'consumer-entry',
      section: 'consumerVars',
      path: 'slot',
    });
  });

  test('resolving a file _ref with deferModuleRefs true does not produce a placeholder', async () => {
    // A file _ref (no module key) must not be deferred — the refDef.module guard
    // in resolveRef ensures only module refs become records.
    // (The actual file resolution may fail due to missing test fixtures; we only
    //  care about the deferral branch not activating.)
    const buildContext = createBuildContext();
    buildContext.refMap = {};

    const ctx = new WalkContext({
      buildContext,
      refId: 'entry:lowdefy.yaml:0',
      sourceRefId: null,
      vars: {},
      moduleEntry: null,
      moduleRoot: null,
      packageRoot: null,
      path: '',
      currentFile: '/app/lowdefy.yaml',
      refChain: new Set(['/app/lowdefy.yaml']),
      deferModuleRefs: true,
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
    });

    const node = { _ref: '/app/some-file.yaml' };
    const result = await resolve(node, ctx);
    // Result must NOT be a placeholder — either resolved content or null
    // (null when getRefContent fails due to missing file in tests).
    expect(result === null || result['~deferred'] === undefined).toBe(true);
  });

  test('cloneWithMarkers carries placeholders through unchanged', async () => {
    const { default: cloneWithMarkers } = await import('./cloneWithMarkers.js');

    const placeholder = { '~deferred': 'consumer-entry:consumerVars.slot' };
    const cloned = cloneWithMarkers({ wrapper: placeholder });

    // Plain enumerable data — the whole point of the record placeholder.
    expect(cloned.wrapper).toEqual({ '~deferred': 'consumer-entry:consumerVars.slot' });
  });
});

describe('_build.authConfig deferral before the projection exists', () => {
  function createDeferAuthConfigContext({ authConfigProjection, deferAuthConfig = true, vars } = {}) {
    const buildContext = createBuildContext();
    if (authConfigProjection !== undefined) {
      buildContext.authConfigProjection = authConfigProjection;
    }
    return new WalkContext({
      buildContext,
      refId: 'test:lowdefy.yaml:0',
      sourceRefId: null,
      vars: vars ?? {},
      path: '',
      currentFile: 'lowdefy.yaml',
      refChain: new Set(['lowdefy.yaml']),
      operators,
      env: process.env,
      dynamicIdentifiers,
      shouldStop: null,
      deferAuthConfig,
    });
  }

  const policyFold = () => ({
    '_build.if': {
      test: {
        '_build.eq': [{ '_build.authConfig': 'organizations.policy' }, 'tenant'],
      },
      then: [{ clause: true }],
      else: [],
    },
  });

  test('fold over _build.authConfig defers when the projection is absent', async () => {
    const ctx = createDeferAuthConfigContext();
    const result = await resolve(policyFold(), ctx);
    expect(result).toEqual(policyFold());
    expect(ctx.buildContext.errors).toEqual([]);
  });

  test('bare _build.authConfig defers when the projection is absent', async () => {
    const ctx = createDeferAuthConfigContext();
    const node = { '_build.authConfig': 'organizations.policy' };
    const result = await resolve(node, ctx);
    expect(result).toEqual({ '_build.authConfig': 'organizations.policy' });
    expect(ctx.buildContext.errors).toEqual([]);
  });

  test('deferred fold keeps its resolved children', async () => {
    const ctx = createDeferAuthConfigContext({ vars: { shape: 'search_filter' } });
    const node = {
      '_build.if': {
        test: {
          '_build.eq': [{ '_build.authConfig': 'organizations.policy' }, 'tenant'],
        },
        then: [{ _var: 'shape' }],
        else: [],
      },
    };
    const result = await resolve(node, ctx);
    // _var substituted bottom-up; only the _build.* folds stay deferred.
    expect(result['_build.if'].then).toEqual(['search_filter']);
    expect(result['_build.if'].test).toEqual({
      '_build.eq': [{ '_build.authConfig': 'organizations.policy' }, 'tenant'],
    });
  });

  test('fold evaluates when the projection is present', async () => {
    const ctx = createDeferAuthConfigContext({
      authConfigProjection: { organizations: { policy: 'tenant', signup: 'open' } },
    });
    const result = await resolve(policyFold(), ctx);
    expect(result).toEqual([{ clause: true }]);
    expect(ctx.buildContext.errors).toEqual([]);
  });

  test('fold evaluates the pinned branch when the projection is present', async () => {
    const ctx = createDeferAuthConfigContext({
      authConfigProjection: { organizations: { policy: 'pinned', signup: 'invite-only' } },
    });
    const result = await resolve(policyFold(), ctx);
    expect(result).toEqual([]);
  });

  test('without deferAuthConfig an absent projection is still a collected error', async () => {
    const ctx = createDeferAuthConfigContext({ deferAuthConfig: false });
    await resolve(policyFold(), ctx);
    expect(ctx.buildContext.errors.length).toBeGreaterThan(0);
    expect(ctx.buildContext.errors[0].message).toContain(
      '_build.authConfig is not available here.'
    );
  });

  test('deferAuthConfig does not defer folds that read no authConfig', async () => {
    const ctx = createDeferAuthConfigContext();
    const node = { '_build.eq': ['a', 'a'] };
    const result = await resolve(node, ctx);
    expect(result).toBe(true);
  });

  test('deferAuthConfig propagates through child contexts', async () => {
    const ctx = createDeferAuthConfigContext();
    const node = { outer: { inner: policyFold() } };
    const result = await resolve(node, ctx);
    expect(result.outer.inner).toEqual(policyFold());
    expect(ctx.buildContext.errors).toEqual([]);
  });
});
