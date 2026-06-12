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

describe('E1: every ref form emits compiler-native calls (no delegation)', () => {
  const compileMarkers = (source, opts = {}) =>
    compileSource({
      source,
      file: 'lowdefy.yaml',
      mode: 'markers',
      configDir: '/cfg',
      resolveImport: (p) => `./${p}.js`,
      ...opts,
    }).code;

  test('module component refs without a static target emit the registry lookup', () => {
    const code = compileMarkers(
      'pages:\n  - _ref:\n      module: core\n      component: stamp\n      vars:\n        a: 1\n'
    );
    expect(code).toContain('_r.moduleComponentRef({ scope, registry: true, module: "core"');
    expect(code).toContain('component: "stamp"');
    expect(code).not.toContain('_r.ref(');
    expect(code).not.toContain('delegatedRef');
  });

  test('module page refs emit the runtime error ladder', () => {
    const code = compileMarkers('pages:\n  - _ref:\n      module: core\n      page: home\n');
    expect(code).toContain('_r.invalidModuleRef({ scope, def: _r.mark({');
    expect(code).toContain('page: "home"');
  });

  test('non-YAML content paths emit contentRef', () => {
    const code = compileMarkers('properties:\n  _ref: data/settings.json\n');
    expect(code).toContain('_r.contentRef({ scope, path: "data/settings.json"');
    expect(code).not.toContain('_r.ref(');
  });

  test('js paths emit jsRef', () => {
    const code = compileMarkers('properties:\n  fn:\n    _ref: fns/transform.js\n');
    expect(code).toContain('_r.jsRef({ scope, path: "fns/transform.js"');
  });

  test('operator-built paths emit dynRef with a compiled path expression', () => {
    const code = compileMarkers(
      'pages:\n  - _ref:\n      path:\n        _build.string.concat:\n          - pages/\n          - home.yaml\n'
    );
    expect(code).toContain('_r.dynRef({ scope, path:');
    expect(code).toContain('_r.buildOperator(');
    expect(code).not.toContain('delegatedRef');
  });

  test('the _ref _var path shorthand emits dynRef on the var value', () => {
    const code = compileMarkers('blocks:\n  - _ref:\n      _var: contentFile\n');
    expect(code).toContain('_r.dynRef({ scope, path:');
    expect(code).toContain('_r.getVar(');
  });

  test('resolver refs emit resolverRef with the raw def for refMap original', () => {
    const code = compileMarkers('pages:\n  - _ref:\n      resolver: resolvers/r.js\n');
    expect(code).toContain('_r.resolverRef({ scope, resolver: "resolvers/r.js", path: undefined');
    expect(code).toContain('"resolver": "resolvers/r.js"');
  });

  test('resolver refs with a path pass the path through', () => {
    const code = compileMarkers(
      'pages:\n  - _ref:\n      resolver: resolvers/r.js\n      path: virtual/x.yaml\n'
    );
    expect(code).toContain(
      '_r.resolverRef({ scope, resolver: "resolvers/r.js", path: "virtual/x.yaml"'
    );
  });

  test('a global refResolver routes every path ref through resolverRef except the lowdefy root', () => {
    const code = compileMarkers('pages:\n  - _ref: pages/home.yaml\n', {
      refResolver: 'resolvers/global.js',
    });
    expect(code).toContain('_r.resolverRef({ scope, resolver: "resolvers/global.js"');
    expect(code).not.toContain('_r.ref(');
    const rootCode = compileMarkers('pages:\n  - _ref: lowdefy.yaml\n', {
      refResolver: 'resolvers/global.js',
    });
    expect(rootCode).toContain('_r.ref({ scope, factory:');
  });

  test('yaml refs still compile to static imports', () => {
    const code = compileMarkers('pages:\n  - _ref: pages/home.yaml\n');
    expect(code).toContain('_r.ref({ scope, factory:');
    expect(code).not.toContain('delegatedRef');
  });
});

test('errors mode keeps explicit not-yet-compiled errors for module forms', () => {
  expect(() =>
    compileSource({
      source: 'pages:\n  - _ref:\n      module: core\n      component: stamp\n',
      file: 'lowdefy.yaml',
      configDir: '/cfg',
    })
  ).toThrow('not yet compiled (config-compiler S1 scope)');
});
