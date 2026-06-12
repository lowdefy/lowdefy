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

import compileSource from './compileSource.js';
import { compileAndRun, cleanTmp } from './test/harness.js';

afterAll(() => {
  cleanTmp();
});

test('compileSource rejects .yaml.njk structural templates with the codemod message', () => {
  expect(() =>
    compileSource({ source: 'id: {{ x }}', file: 'page.yaml.njk', configDir: '/cfg' })
  ).toThrow('Structural nunjucks templates (.yaml.njk) are no longer supported');
  expect(() =>
    compileSource({ source: 'id: {{ x }}', file: 'page.yaml.njk', configDir: '/cfg' })
  ).toThrow('migration codemod');
});

test('compileSource reports YAML parse errors with file and line', () => {
  expect(() =>
    compileSource({ source: 'a:\n  - b\n - c\n', file: 'bad.yaml', configDir: '/cfg' })
  ).toThrow('YAML parse error in "bad.yaml"');
});

describe('emission safety — user strings cannot break out of generated code', () => {
  const nastyStrings = [
    `single ' quote`,
    `double " quote`,
    'back ` tick',
    // eslint-disable-next-line no-template-curly-in-string
    'template ${injection} attempt',
    'comment */ terminator /* attempt',
    'newline\nand\ttabs',
    '\\backslash\\',
    '</script><script>alert(1)</script>',
    '"; process.exit(1); //',
    ' line separators',
  ];

  test.each(nastyStrings.map((s, i) => [i, s]))(
    'nasty string %#: value round-trips exactly',
    async (i, value) => {
      const { output } = await compileAndRun({
        files: { 'a.yaml': `key: ${JSON.stringify(value)}\nid: x\n` },
        entry: 'a.yaml',
      });
      expect(output.key).toBe(value);
    }
  );

  test('nasty strings as map keys round-trip exactly', async () => {
    const key = `a'b"c\`d\${e}`;
    const { output } = await compileAndRun({
      files: { 'a.yaml': `${JSON.stringify(key)}: value\n` },
      entry: 'a.yaml',
    });
    expect(output[key]).toBe('value');
  });
});

test('runtime operator objects pass through verbatim with compiled children', async () => {
  const { output } = await compileAndRun({
    files: {
      'a.yaml': `
visible:
  _eq:
    - _state: tab
    - _var: tabName
`,
    },
    entry: 'a.yaml',
    vars: { tabName: 'files' },
  });
  expect(output).toEqual({ visible: { _eq: [{ _state: 'tab' }, 'files'] } });
});

test('a single non-tilde underscore key with siblings is plain data, not an operator', async () => {
  const { output } = await compileAndRun({
    files: { 'a.yaml': `_custom: 1\nother: 2\n` },
    entry: 'a.yaml',
  });
  expect(output).toEqual({ _custom: 1, other: 2 });
});

test('~ keys are emitted as plain data', async () => {
  const { output } = await compileAndRun({
    files: { 'a.yaml': `'~ignoreBuildChecks': true\n_state: x\n` },
    entry: 'a.yaml',
  });
  expect(output).toEqual({ '~ignoreBuildChecks': true, _state: 'x' });
});
