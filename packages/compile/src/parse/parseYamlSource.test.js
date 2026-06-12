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

import compileSource from '../compileSource.js';
import parseYamlSource from './parseYamlSource.js';
import { compileAndRun, cleanTmp } from '../test/harness.js';

afterAll(() => {
  cleanTmp();
});

test('parseYamlSource produces positioned IR for maps, seqs, and scalars', () => {
  const ir = parseYamlSource({ source: 'a: 1\nlist:\n  - x\n', file: 'a.yaml' });
  expect(ir.t).toBe('map');
  expect(ir.entries[0]).toMatchObject({ key: 'a', value: { t: 'lit', value: 1 } });
  expect(ir.entries[0].value.pos.line).toBe(1);
  expect(ir.entries[1].value.t).toBe('seq');
  expect(ir.entries[1].value.items[0].pos.line).toBe(3);
});

test('parseYamlSource resolves anchors and aliases to literals at the alias site', async () => {
  const { output } = await compileAndRun({
    files: {
      'a.yaml': `
base: &anchor
  shared: value
copy: *anchor
`,
    },
    entry: 'a.yaml',
  });
  expect(output).toEqual({ base: { shared: 'value' }, copy: { shared: 'value' } });
});

test('parseYamlSource falls back to a literal subtree for non-string keys', async () => {
  const { output } = await compileAndRun({
    files: { 'a.yaml': `wrapper:\n  1: numeric-key\n  two: ok\n` },
    entry: 'a.yaml',
  });
  expect(output).toEqual({ wrapper: { 1: 'numeric-key', two: 'ok' } });
});

test('parseYamlSource handles empty documents as null', async () => {
  const { output } = await compileAndRun({
    files: { 'a.yaml': `x:\n  _ref: empty.yaml\n`, 'empty.yaml': `` },
    entry: 'a.yaml',
  });
  expect(output).toEqual({ x: null });
});

describe('S1-scope deferrals fail compilation with explicit messages', () => {
  const cases = [
    [
      'module component refs',
      `x:\n  _ref:\n    module: files\n    component: upload\n`,
      '_ref module refs are not yet compiled',
    ],
    [
      'module menu refs',
      `x:\n  _ref:\n    module: files\n    menu: main\n`,
      '_ref module refs are not yet compiled',
    ],
  ];
  test.each(cases)('%s', (name, source, message) => {
    expect(() => compileSource({ source, file: 'x.yaml', configDir: '/cfg' })).toThrow(message);
  });

  test('dynamic transformer paths fail with the S1 message', () => {
    const source = `x:\n  _ref:\n    path: a.yaml\n    transformer:\n      _var: t\n`;
    expect(() => compileSource({ source, file: 'x.yaml', configDir: '/cfg' })).toThrow(
      'dynamic transformers are not yet compiled'
    );
  });
});

describe('invalid _ref shapes fail compilation with location', () => {
  test('_ref with a numeric definition', () => {
    expect(() =>
      compileSource({ source: `x:\n  _ref: 42\n`, file: 'x.yaml', configDir: '/cfg' })
    ).toThrow('_ref takes a string or object definition in "x.yaml" (line 2).');
  });
  test('_ref without a path', () => {
    expect(() =>
      compileSource({ source: `x:\n  _ref:\n    key: a\n`, file: 'x.yaml', configDir: '/cfg' })
    ).toThrow('_ref requires a path in "x.yaml"');
  });
  test('_ref with non-object vars', () => {
    expect(() =>
      compileSource({
        source: `x:\n  _ref:\n    path: a.yaml\n    vars: nope\n`,
        file: 'x.yaml',
        configDir: '/cfg',
      })
    ).toThrow('_ref vars must be an object in "x.yaml"');
  });
});
