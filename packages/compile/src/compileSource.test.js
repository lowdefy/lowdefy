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

describe('markers mode delegates walker-only ref forms (S1b)', () => {
  const compileMarkers = (source) =>
    compileSource({
      source,
      file: 'lowdefy.yaml',
      mode: 'markers',
      configDir: '/cfg',
      resolveImport: (p) => `./${p}.js`,
    }).code;

  test('module component refs emit a delegatedRef call with a ~l-marked def', () => {
    const code = compileMarkers(
      'pages:\n  - _ref:\n      module: core\n      component: stamp\n      vars:\n        a: 1\n'
    );
    expect(code).toContain('_r.delegatedRef({ scope, def: _r.mark({');
    expect(code).toContain('"module": "core"');
    expect(code).toContain('"component": "stamp"');
    // vars maps carry their key line for refMap `original` parity.
    expect(code).toContain('"vars": _r.mark({ "a": 1 }');
    expect(code).not.toContain('_r.ref(');
  });

  test('non-YAML content paths delegate, string form passing the string def', () => {
    const code = compileMarkers('properties:\n  _ref: data/settings.json\n');
    expect(code).toContain('_r.delegatedRef({ scope, def: "data/settings.json"');
    expect(code).not.toContain('_r.ref(');
  });

  test('operator-built paths delegate with the path expression evaluated in place', () => {
    const code = compileMarkers(
      'pages:\n  - _ref:\n      path:\n        _build.string.concat:\n          - pages/\n          - home.yaml\n'
    );
    expect(code).toContain('_r.delegatedRef(');
    expect(code).toContain('"path": _r.markDeep(_r.buildOperator(');
  });

  test('the _ref _var path shorthand delegates through getVar', () => {
    const code = compileMarkers('blocks:\n  - _ref:\n      _var: contentFile\n');
    expect(code).toContain('_r.delegatedRef(');
    expect(code).toContain('"path": _r.getVar({ scope');
  });

  test('resolver refs delegate; non-string resolver values stay a compile error', () => {
    const code = compileMarkers('pages:\n  - _ref:\n      resolver: resolvers/r.js\n');
    expect(code).toContain('"resolver": "resolvers/r.js"');
    expect(() => compileMarkers('pages:\n  - _ref:\n      resolver:\n        _var: r\n')).toThrow(
      'not yet compiled (config-compiler S1 scope)'
    );
  });

  test('yaml refs still compile to static imports, not delegation', () => {
    const code = compileMarkers('pages:\n  - _ref: pages/home.yaml\n');
    expect(code).toContain('_r.ref({ scope, factory:');
    expect(code).not.toContain('_r.delegatedRef');
  });
});

test('errors mode keeps explicit not-yet-compiled errors for walker-only forms', () => {
  expect(() =>
    compileSource({
      source: 'pages:\n  - _ref:\n      module: core\n      component: stamp\n',
      file: 'lowdefy.yaml',
      configDir: '/cfg',
    })
  ).toThrow('not yet compiled (config-compiler S1 scope)');
  expect(() =>
    compileSource({
      source: 'properties:\n  _ref: data/settings.json\n',
      file: 'lowdefy.yaml',
      configDir: '/cfg',
    })
  ).toThrow('_ref to non-YAML content');
});
