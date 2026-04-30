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

import operators from '@lowdefy/operators-js/operators/build';
import testContext from '../../test-utils/testContext.js';
import { resolve, WalkContext } from './walker.js';
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
    refDef: overrides.refDef ?? {
      id: 'test:module.lowdefy.yaml:0',
      path: '/modules/test/module.lowdefy.yaml',
    },
    exports: overrides.exports ?? {
      pages: [],
      components: [],
      menus: [],
      connections: [],
      api: [],
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
  exports: {
    pages: [{ id: 'settings' }, { id: 'dashboard' }],
    connections: [{ id: 'users-db' }, { id: 'cache-db' }],
    api: [{ id: 'invite-user' }, { id: 'remove-user' }],
  },
  connections: {},
  moduleDependencies: {
    events: 'events-entry',
  },
};

const eventsEntry = {
  id: 'events-entry',
  exports: {
    pages: [{ id: 'event-log' }],
    connections: [{ id: 'events-db' }],
    api: [{ id: 'send-event' }],
  },
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

  test('string form throws for page not in exports', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    await expect(resolve({ '_module.pageId': 'nonexistent' }, ctx)).rejects.toThrow(
      'Module "entry-id" does not export page "nonexistent".'
    );
  });

  test('object form resolves cross-module page', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve({ '_module.pageId': { id: 'event-log', module: 'events' } }, ctx);
    expect(result).toBe('events-entry/event-log');
  });

  test('object form throws for page not in target exports', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    await expect(
      resolve({ '_module.pageId': { id: 'missing', module: 'events' } }, ctx)
    ).rejects.toThrow(
      'Module "entry-id" references page "missing" from "events" (entry "events-entry"), but that module does not export page "missing".'
    );
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

  test('string form throws for connection not in exports', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    await expect(resolve({ '_module.connectionId': 'missing' }, ctx)).rejects.toThrow(
      'Module "entry-id" does not export connection "missing".'
    );
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

  test('string form throws for endpoint not in exports', async () => {
    const ctx = createWalkContext({
      moduleEntry: testModuleEntry,
      buildContext: createModuleBuildContext(),
    });
    await expect(resolve({ '_module.endpointId': 'missing' }, ctx)).rejects.toThrow(
      'Module "entry-id" does not export endpoint "missing".'
    );
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

  test('_module.id object form resolves at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    const result = await resolve({ '_module.id': { module: 'events-entry' } }, ctx);
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
    await expect(resolve({ '_module.id': { module: 'nonexistent' } }, ctx)).rejects.toThrow(
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

  test('_module.connectionId object form throws for nonexistent export at app level', async () => {
    const ctx = createWalkContext({
      moduleEntry: null,
      buildContext: createModuleBuildContext(),
    });
    await expect(
      resolve(
        { '_module.connectionId': { id: 'nonexistent-connection', module: 'events-entry' } },
        ctx
      )
    ).rejects.toThrow('does not export connection "nonexistent-connection"');
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

describe('_module.var with computed name (bottom-up)', () => {
  test('_build.string.concat computes module variable name', async () => {
    const entry = createModuleEntry({ theme: 'dark' });
    const ctx = createWalkContext({ moduleEntry: entry });
    const result = await resolve({ '_module.var': { '_build.string.concat': ['the', 'me'] } }, ctx);
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

  test('preserves _module.var when moduleRoot set but no moduleEntry (Phase 1a)', async () => {
    const ctx = new WalkContext({
      buildContext: createBuildContext(),
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
    const node = { '_module.var': 'theme' };
    const result = await resolve(node, ctx);
    expect(result).toEqual({ '_module.var': 'theme' });
  });
});

describe('regression — existing compositions still work', () => {
  test('_build.string.concat with _var argument', async () => {
    const ctx = createWalkContext({ vars: { prefix: 'admin' } });
    const result = await resolve({ '_build.string.concat': [{ _var: 'prefix' }, '-page'] }, ctx);
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
