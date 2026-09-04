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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { ConfigError, LowdefyInternalError } from '@lowdefy/errors';

import resolveJsModule from './resolveJsModule.js';

let configDirectory;

// A _js node always sits inside a config file; the default context stands in
// for one written directly in lowdefy.yaml.
function createContext({
  refMap = { root: { path: 'lowdefy.yaml' } },
  keyMap = { k1: { '~r': 'root' } },
} = {}) {
  return {
    directories: { config: configDirectory },
    jsModules: { client: {}, server: {} },
    keyMap,
    refMap,
  };
}

function writeModule(relativePath, source) {
  const absolutePath = path.join(configDirectory, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, source);
  return absolutePath;
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-js-modules-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('resolveJsModule resolves relative to the containing config file and hashes the config-root path', () => {
  const absolutePath = writeModule(
    'pages/lib/rows.js',
    'export function buildRows() { return []; }'
  );
  const context = createContext({ refMap: { r1: { path: 'pages/home.yaml' } } });

  const result = resolveJsModule({
    context,
    configKey: 'k1',
    env: 'client',
    fn: './lib/rows.js#buildRows',
    refId: 'r1',
  });

  expect(result.absolutePath).toBe(absolutePath);
  expect(result.exportName).toBe('buildRows');
  expect(result.relativePath).toBe('pages/lib/rows.js');
  expect(context.jsModules.client[result.hash]).toEqual({
    absolutePath,
    exportName: 'buildRows',
    relativePath: 'pages/lib/rows.js',
    configKey: 'k1',
  });
});

test('resolveJsModule finds the containing file through the keyMap chain when the node has no ~r', () => {
  writeModule('pages/lib/rows.js', 'export function buildRows() {}');
  const context = createContext({
    refMap: { r1: { path: 'pages/home.yaml' } },
    keyMap: {
      k0: { key: 'root.pages[0]', '~r': 'r1' },
      k1: { key: 'root.pages[0].blocks[0]', '~k_parent': 'k0' },
    },
  });
  const result = resolveJsModule({
    context,
    configKey: 'k1',
    env: 'client',
    fn: './lib/rows.js#buildRows',
  });
  expect(result.relativePath).toBe('pages/lib/rows.js');
});

test('resolveJsModule throws an internal error when the containing config file cannot be found', () => {
  writeModule('lib/rows.js', 'export const buildRows = () => [];');
  const context = createContext({ refMap: {}, keyMap: {} });

  expect(() =>
    resolveJsModule({
      context,
      configKey: 'k1',
      env: 'server',
      fn: './lib/rows.js#buildRows',
      refId: undefined,
    })
  ).toThrow(LowdefyInternalError);
  expect(Object.keys(context.jsModules.server)).toEqual([]);
});

test('resolveJsModule resolves an .mjs module', () => {
  writeModule('pages/lib/rows.mjs', 'export const buildRows = () => [];');
  const context = createContext({ refMap: { r1: { path: 'pages/home.yaml' } } });

  const result = resolveJsModule({
    context,
    configKey: 'k1',
    env: 'server',
    fn: './lib/rows.mjs#buildRows',
    refId: 'r1',
  });

  expect(result.relativePath).toBe('pages/lib/rows.mjs');
});

test('resolveJsModule hashes the same file identically from two config files and differently for two files', () => {
  writeModule('a/lib/x.js', 'export function run() {}');
  writeModule('b/lib/x.js', 'export function run() {}');
  writeModule('a/lib/y.js', 'export function run() {}');
  const context = createContext({
    refMap: {
      a: { path: 'a/page.yaml' },
      a2: { path: 'a/other.yaml' },
      b: { path: 'b/page.yaml' },
    },
  });
  const fromA = resolveJsModule({ context, env: 'client', fn: './lib/x.js#run', refId: 'a' });
  const fromA2 = resolveJsModule({ context, env: 'client', fn: './lib/x.js#run', refId: 'a2' });
  const fromB = resolveJsModule({ context, env: 'client', fn: './lib/x.js#run', refId: 'b' });
  const fromAY = resolveJsModule({ context, env: 'client', fn: './lib/y.js#run', refId: 'a' });

  expect(fromA.hash).toBe(fromA2.hash);
  expect(fromA.hash).not.toBe(fromB.hash);
  expect(fromA.hash).not.toBe(fromAY.hash);
  expect(Object.keys(context.jsModules.client)).toHaveLength(3);
});

test('resolveJsModule hash is stable across runs for the same config-root path and export', () => {
  writeModule('lib/x.js', 'export function run() {}');
  const first = resolveJsModule({
    context: createContext(),
    configKey: 'k1',
    env: 'client',
    fn: './lib/x.js#run',
  });
  const second = resolveJsModule({
    context: createContext(),
    configKey: 'k1',
    env: 'client',
    fn: './lib/x.js#run',
  });
  expect(first.hash).toBe(second.hash);
});

test('resolveJsModule resolves #default', () => {
  writeModule('lib/x.js', 'export default function run() {}');
  const result = resolveJsModule({
    context: createContext(),
    configKey: 'k1',
    env: 'client',
    fn: './lib/x.js#default',
  });
  expect(result.exportName).toBe('default');
});

test('resolveJsModule resolves ../ paths above the containing file', () => {
  writeModule('lib/x.js', 'export default 1;');
  const context = createContext({ refMap: { r: { path: 'pages/deep/page.yaml' } } });
  const result = resolveJsModule({
    context,
    env: 'client',
    fn: '../../lib/x.js#default',
    refId: 'r',
  });
  expect(result.relativePath).toBe('lib/x.js');
});

test('resolveJsModule collects every export shape', () => {
  writeModule(
    'lib/x.js',
    [
      'export function fnDecl() {}',
      'export class ClassDecl {}',
      'export const a = 1, { b, c: [d] } = obj;',
      'const e = 1; export { e, e as f };',
      "export { g as h } from './other.js';",
      "export * as ns from './other.js';",
    ].join('\n')
  );
  for (const name of ['fnDecl', 'ClassDecl', 'a', 'b', 'd', 'e', 'f', 'h', 'ns']) {
    const result = resolveJsModule({
      context: createContext(),
      configKey: 'k1',
      env: 'client',
      fn: `./lib/x.js#${name}`,
    });
    expect(result.exportName).toBe(name);
  }
});

function expectConfigError(fn, message) {
  let error;
  try {
    fn();
  } catch (e) {
    error = e;
  }
  expect(error).toBeInstanceOf(ConfigError);
  expect(error.message).toBe(message);
  expect(error.configKey).toBe('k1');
  expect(error.checkSlug).toBe('js-modules');
}

test('resolveJsModule throws for a malformed reference', () => {
  const context = createContext();
  for (const fn of [
    './lib/x.js',
    './lib/x#run',
    './lib/x.js#1bad',
    './lib/x.js#a#b',
    './lib/x.ts#run',
  ]) {
    expectConfigError(
      () => resolveJsModule({ context, configKey: 'k1', env: 'client', fn }),
      `_js module reference must be "<relative path to a .js or .mjs file>#<exportName>". Received "${fn}".`
    );
  }
});

test('resolveJsModule throws when the file is missing', () => {
  const context = createContext({ refMap: { r: { path: 'pages/home.yaml' } } });
  const resolved = path.join(configDirectory, 'pages/lib/answer-detail.js');
  expectConfigError(
    () =>
      resolveJsModule({
        context,
        configKey: 'k1',
        env: 'client',
        fn: './lib/answer-detail.js#buildRows',
        refId: 'r',
      }),
    `_js module file not found: "./lib/answer-detail.js" resolved to "${resolved}", relative to the config file "pages" that contains it. Module paths are relative to their own config file, unlike _ref, which is relative to the config root — that reading would be "${path.join(
      configDirectory,
      'lib/answer-detail.js'
    )}".`
  );
});

test('resolveJsModule throws when the module resolves outside the config directory', () => {
  const context = createContext();
  const resolved = path.resolve(configDirectory, '../outside.js');
  expectConfigError(
    () => resolveJsModule({ context, configKey: 'k1', env: 'client', fn: '../outside.js#run' }),
    `_js module "../outside.js" resolves outside the config directory (resolved to "${resolved}"). Modules must live inside the config directory so the built server can carry a copy.`
  );
});

test('resolveJsModule throws when the file does not parse', () => {
  writeModule('lib/x.js', 'export function run( {\n  return 1;\n}');
  expectConfigError(
    () =>
      resolveJsModule({
        context: createContext(),
        configKey: 'k1',
        env: 'client',
        fn: './lib/x.js#run',
      }),
    '_js module "./lib/x.js" could not be parsed: Unexpected keyword \'return\' (line 2, column 3).'
  );
});

test('resolveJsModule throws when the export is missing and suggests a close name', () => {
  writeModule('lib/x.js', 'export function buildRows() {}\nexport const helper = 1;');
  expectConfigError(
    () =>
      resolveJsModule({
        context: createContext(),
        configKey: 'k1',
        env: 'client',
        fn: './lib/x.js#buildRow',
      }),
    '_js module "./lib/x.js" has no export "buildRow". Exports: buildRows, helper. Did you mean "buildRows"?'
  );
});

test('resolveJsModule throws without a suggestion when no export is close', () => {
  writeModule('lib/x.js', 'export function buildRows() {}');
  expectConfigError(
    () =>
      resolveJsModule({
        context: createContext(),
        configKey: 'k1',
        env: 'client',
        fn: './lib/x.js#zzzzzzzzzz',
      }),
    '_js module "./lib/x.js" has no export "zzzzzzzzzz". Exports: buildRows.'
  );
});

test('resolveJsModule throws when the export may come from export *', () => {
  writeModule('lib/x.js', "export * from './other.js';\nexport const a = 1;");
  expectConfigError(
    () =>
      resolveJsModule({
        context: createContext(),
        configKey: 'k1',
        env: 'client',
        fn: './lib/x.js#run',
      }),
    '_js module "./lib/x.js" re-exports with "export *". Name the export explicitly so the build can check it.'
  );
  // An export found directly is not blocked by export *.
  expect(
    resolveJsModule({
      context: createContext(),
      configKey: 'k1',
      env: 'client',
      fn: './lib/x.js#a',
    }).exportName
  ).toBe('a');
});
