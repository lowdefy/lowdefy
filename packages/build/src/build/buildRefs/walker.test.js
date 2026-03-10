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

function createWalkContext({ moduleVars, vars, buildContext } = {}) {
  const ctx = buildContext ?? createBuildContext();
  return new WalkContext({
    buildContext: ctx,
    refId: 'test:lowdefy.yaml:0',
    sourceRefId: null,
    vars: vars ?? {},
    moduleVars,
    path: '',
    currentFile: 'lowdefy.yaml',
    refChain: new Set(['lowdefy.yaml']),
    operators,
    env: process.env,
    dynamicIdentifiers,
    shouldStop: null,
  });
}

beforeEach(() => {
  mockReadConfigFile.mockClear();
});

describe('_module.var resolution', () => {
  test('resolves simple string key from moduleVars', async () => {
    const ctx = createWalkContext({
      moduleVars: { roles: ['admin', 'editor'] },
    });
    const node = { '_module.var': 'roles' };
    const result = await resolve(node, ctx);
    expect(result).toEqual(['admin', 'editor']);
  });

  test('resolves nested key path from moduleVars', async () => {
    const ctx = createWalkContext({
      moduleVars: { components: { table_columns: ['name', 'email'] } },
    });
    const node = { '_module.var': 'components.table_columns' };
    const result = await resolve(node, ctx);
    expect(result).toEqual(['name', 'email']);
  });

  test('returns null for missing key with string form', async () => {
    const ctx = createWalkContext({
      moduleVars: { roles: ['admin'] },
    });
    const node = { '_module.var': 'missing_key' };
    const result = await resolve(node, ctx);
    expect(result).toBeNull();
  });

  test('resolves object form with key', async () => {
    const ctx = createWalkContext({
      moduleVars: { theme: 'dark' },
    });
    const node = { '_module.var': { key: 'theme' } };
    const result = await resolve(node, ctx);
    expect(result).toBe('dark');
  });

  test('resolves object form with default when key missing', async () => {
    const ctx = createWalkContext({
      moduleVars: {},
    });
    const node = { '_module.var': { key: 'components.table_columns', default: [] } };
    const result = await resolve(node, ctx);
    expect(result).toEqual([]);
  });

  test('uses value over default when key exists', async () => {
    const ctx = createWalkContext({
      moduleVars: { title: 'My Page' },
    });
    const node = { '_module.var': { key: 'title', default: 'Default Title' } };
    const result = await resolve(node, ctx);
    expect(result).toBe('My Page');
  });

  test('uses value even when null (not undefined)', async () => {
    const ctx = createWalkContext({
      moduleVars: { title: null },
    });
    const node = { '_module.var': { key: 'title', default: 'Default Title' } };
    const result = await resolve(node, ctx);
    expect(result).toBeNull();
  });

  test('returns null when default is not provided and key missing', async () => {
    const ctx = createWalkContext({
      moduleVars: {},
    });
    const node = { '_module.var': { key: 'missing' } };
    const result = await resolve(node, ctx);
    expect(result).toBeNull();
  });

  test('passes through unchanged when moduleVars is null', async () => {
    const ctx = createWalkContext({
      moduleVars: null,
    });
    const node = { '_module.var': 'roles' };
    const result = await resolve(node, ctx);
    expect(result).toEqual({ '_module.var': 'roles' });
  });

  test('passes through unchanged when moduleVars is undefined', async () => {
    const ctx = createWalkContext();
    const node = { '_module.var': 'roles' };
    const result = await resolve(node, ctx);
    expect(result).toEqual({ '_module.var': 'roles' });
  });

  test('throws on invalid argument type', async () => {
    const ctx = createWalkContext({
      moduleVars: { roles: ['admin'] },
    });
    const node = { '_module.var': 123 };
    await expect(resolve(node, ctx)).rejects.toThrow(
      '_module.var operator takes a string or object with "key" field as arguments.'
    );
  });

  test('throws on object without key field', async () => {
    const ctx = createWalkContext({
      moduleVars: { roles: ['admin'] },
    });
    const node = { '_module.var': { value: 'something' } };
    await expect(resolve(node, ctx)).rejects.toThrow(
      '_module.var operator takes a string or object with "key" field as arguments.'
    );
  });

  test('deep clones resolved values to prevent mutation', async () => {
    const originalArray = ['admin', 'editor'];
    const ctx = createWalkContext({
      moduleVars: { roles: originalArray },
    });
    const node = { '_module.var': 'roles' };
    const result = await resolve(node, ctx);
    expect(result).toEqual(['admin', 'editor']);
    result.push('viewer');
    expect(originalArray).toEqual(['admin', 'editor']);
  });
});

describe('_module.var propagation through WalkContext', () => {
  test('moduleVars propagates through child()', () => {
    const moduleVars = { theme: 'dark' };
    const ctx = createWalkContext({ moduleVars });
    const child = ctx.child('pages');
    expect(child.moduleVars).toBe(moduleVars);
  });

  test('moduleVars propagates through forRef() when not overridden', () => {
    const moduleVars = { theme: 'dark' };
    const ctx = createWalkContext({ moduleVars });
    const refCtx = ctx.forRef({ refId: 'ref:test:1', vars: {}, filePath: 'other.yaml' });
    expect(refCtx.moduleVars).toBe(moduleVars);
  });

  test('moduleVars can be overridden in forRef()', () => {
    const moduleVars = { theme: 'dark' };
    const newModuleVars = { theme: 'light' };
    const ctx = createWalkContext({ moduleVars });
    const refCtx = ctx.forRef({
      refId: 'ref:test:1',
      vars: {},
      filePath: 'other.yaml',
      moduleVars: newModuleVars,
    });
    expect(refCtx.moduleVars).toBe(newModuleVars);
  });

  test('_module.var resolves inside nested objects', async () => {
    const ctx = createWalkContext({
      moduleVars: { title: 'Hello', color: 'blue' },
    });
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
    const ctx = createWalkContext({
      moduleVars: { item1: 'first', item2: 'second' },
    });
    const node = [{ '_module.var': 'item1' }, { '_module.var': 'item2' }];
    const result = await resolve(node, ctx);
    expect(result).toEqual(['first', 'second']);
  });

  test('_module.var works alongside _var', async () => {
    const ctx = createWalkContext({
      moduleVars: { moduleTitle: 'Module Title' },
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
