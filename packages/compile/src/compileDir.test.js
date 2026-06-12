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

import { resolveConfigLocation } from '@lowdefy/errors';

import { compileAndRun, compileOnly, cleanTmp } from './test/harness.js';

afterAll(() => {
  cleanTmp();
});

test('compileDir compiles a nested static ref graph and the factory composes it', async () => {
  const { output } = await compileAndRun({
    files: {
      'lowdefy.yaml': `
id: app
pages:
  - _ref: pages/home.yaml
`,
      'pages/home.yaml': `
id: home
type: Box
blocks:
  - _ref:
      path: shared/title.yaml
      vars:
        content: Welcome
`,
      'shared/title.yaml': `
id: title
type: Title
properties:
  content:
    _var: content
`,
    },
    entry: 'lowdefy.yaml',
  });
  expect(output).toEqual({
    id: 'app',
    pages: [
      {
        id: 'home',
        type: 'Box',
        blocks: [{ id: 'title', type: 'Title', properties: { content: 'Welcome' } }],
      },
    ],
  });
});

test('compileDir supports the string _ref form', async () => {
  const { output } = await compileAndRun({
    files: {
      'a.yaml': `child:\n  _ref: b.yaml\n`,
      'b.yaml': `value: 42\n`,
    },
    entry: 'a.yaml',
  });
  expect(output).toEqual({ child: { value: 42 } });
});

test('static circular references collect the walker error and null the parent ref', async () => {
  // Import cycles are legal at the module level; the runtime refChain guard
  // reproduces the walker exactly — the cycle error propagates past the
  // offending ref and nulls the PARENT ref (walker step-7 throw vs the
  // parent's step-11 catch).
  const { output, errors } = await compileAndRun({
    files: {
      'a.yaml': `x:\n  _ref: b.yaml\n`,
      'b.yaml': `y:\n  _ref: a.yaml\n`,
    },
    entry: 'a.yaml',
    collectErrors: true,
  });
  expect(output).toEqual({ x: null });
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toBe(
    'Circular reference detected. File "a.yaml" references itself through:\n  -> a.yaml\n  -> b.yaml\n  -> a.yaml'
  );
  // The error carries the file containing the offending ref and its line.
  expect(errors[0].filePath).toBe('b.yaml');
  expect(errors[0].lineNumber).toBe(1);
});

test('missing static refs collect an error and resolve to null — the rest still builds', async () => {
  const { output, errors } = await compileAndRun({
    files: { 'a.yaml': `x:\n  _ref: missing.yaml\nok: 1\n` },
    entry: 'a.yaml',
    collectErrors: true,
  });
  expect(output).toEqual({ x: null, ok: 1 });
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toContain('Referenced file does not exist: "missing.yaml"');
});

test('a missing entry file fails the compile', async () => {
  await expect(compileOnly({ files: { 'other.yaml': `v: 1\n` }, entry: 'a.yaml' })).rejects.toThrow(
    'Referenced file does not exist: "a.yaml"'
  );
});

test('dynamic _ref paths import through the scope importer at run time', async () => {
  const { output } = await compileAndRun({
    files: {
      'a.yaml': `
child:
  _ref:
    path:
      _build.string.concat:
        - 'parts/'
        - _var: name
        - '.yaml'
`,
      'parts/p1.yaml': `part: one\n`,
    },
    entry: 'a.yaml',
    vars: { name: 'p1' },
  });
  expect(output).toEqual({ child: { part: 'one' } });
});

test('dynamic _ref cycles are caught by the scope refChain guard', async () => {
  // The entry is on the chain from the start (walker buildRefs parity), so
  // the first dynamic self-inclusion is already the cycle. At the top level
  // there is no parent ref to null — the error propagates out of the
  // factory, matching the walker where buildRefs throws to its caller.
  await expect(
    compileAndRun({
      files: {
        'a.yaml': `
x:
  _ref:
    path:
      _build.string.concat: ['a', '.yaml']
`,
      },
      entry: 'a.yaml',
      collectErrors: true,
    })
  ).rejects.toThrow(
    'Circular reference detected. File "a.yaml" references itself through:\n  -> a.yaml\n  -> a.yaml'
  );
});

test('keys mode emits lexical ~k tags, a merged keyMap, and a refMap that resolveConfigLocation consumes', async () => {
  const { output, result } = await compileAndRun({
    files: {
      'a.yaml': `
id: app
section:
  title: Hi
`,
    },
    entry: 'a.yaml',
    mode: 'keys',
  });
  expect(output['~k']).toBeDefined();
  expect(output.section['~k']).toBeDefined();
  const sectionKey = output.section['~k'];
  const entry = result.keyMap[sectionKey];
  // The fixture has a leading blank line — the `section:` key sits on line 3.
  // A map value carries its key's line (addLineNumbers parity).
  expect(entry['~l']).toBe(3);
  const location = resolveConfigLocation({
    configKey: sectionKey,
    keyMap: result.keyMap,
    refMap: result.refMap,
    configDirectory: '/cfg',
  });
  expect(location.source).toContain('a.yaml:3');
});

test('keys mode is deterministic — identical input produces identical keys', async () => {
  const files = { 'a.yaml': `id: app\nitems:\n  - one\n  - two\n` };
  const first = await compileAndRun({ files, entry: 'a.yaml', mode: 'keys' });
  const second = await compileAndRun({ files, entry: 'a.yaml', mode: 'keys' });
  expect(JSON.stringify(first.output)).toEqual(JSON.stringify(second.output));
  expect(first.result.keyMap).toEqual(second.result.keyMap);
});

test('factories return fresh trees per call', async () => {
  const { mod, result } = await compileAndRun({
    files: { 'a.yaml': `obj:\n  deep:\n    value: 1\n` },
    entry: 'a.yaml',
  });
  const { createScope } = await import('./runtime/index.js');
  const one = await mod.default(createScope({ importer: result.importer }));
  const two = await mod.default(createScope({ importer: result.importer }));
  expect(one).toEqual(two);
  expect(one).not.toBe(two);
  expect(one.obj.deep).not.toBe(two.obj.deep);
});

test('emitted module exports file, fileId, refs, and keyMap', async () => {
  const { mod } = await compileAndRun({
    files: { 'a.yaml': `x:\n  _ref: b.yaml\n`, 'b.yaml': `v: 1\n` },
    entry: 'a.yaml',
  });
  expect(mod.file).toBe('a.yaml');
  expect(typeof mod.fileId).toBe('string');
  expect(mod.refs).toEqual(['b.yaml']);
  expect(mod.keyMap).toEqual({});
});
