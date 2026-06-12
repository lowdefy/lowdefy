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

// Feature-parity gate (design D11): identical fixtures run through BOTH the
// existing walker and the compiler; outputs must be deeply equal. The walker
// is imported by relative path — it is intentionally not part of
// @lowdefy/build's public exports.
import path from 'path';
import { fileURLToPath } from 'url';

import operatorsJsBuild from '@lowdefy/operators-js/operators/build';
import * as operatorsNunjucksBuild from '@lowdefy/operators-nunjucks/operators/build';

import createContext from '../../build/src/createContext.js';
import makeRefDefinition from '../../build/src/build/buildRefs/makeRefDefinition.js';
import getRefContent from '../../build/src/build/buildRefs/getRefContent.js';
import { resolve, WalkContext } from '../../build/src/build/buildRefs/walker.js';
import evaluateStaticOperators from '../../build/src/build/buildRefs/evaluateStaticOperators.js';
import collectDynamicIdentifiers from '../../build/src/build/collectDynamicIdentifiers.js';

import { compileAndRun, cleanTmp, makeTmpDir } from './test/harness.js';

const noopLogger = { info() {}, warn() {}, error() {}, debug() {}, log() {} };
const operators = { ...operatorsJsBuild, ...operatorsNunjucksBuild };
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

afterAll(() => {
  cleanTmp();
});

async function resolveWithWalker({ configDir, entry, vars = {} }) {
  const tmp = makeTmpDir();
  const context = createContext({
    directories: { build: path.join(tmp, 'build'), config: configDir, server: tmp },
    logger: noopLogger,
    stage: 'dev',
  });
  context.errors = [];
  context.warnings = [];

  const refDefinition = Object.keys(vars).length > 0 ? { path: entry, vars } : entry;
  const refDef = makeRefDefinition(refDefinition, null, context.refMap);
  context.refMap[refDef.id].path = refDef.path;

  const content = await getRefContent({ context, refDef, referencedFrom: null });
  const ctx = new WalkContext({
    buildContext: context,
    refId: refDef.id,
    sourceRefId: null,
    vars: refDef.vars ?? {},
    moduleDependencies: null,
    moduleEntry: null,
    moduleRoot: null,
    packageRoot: null,
    path: '',
    currentFile: refDef.path ?? '',
    refChain: new Set(),
    operators,
    env: process.env,
    dynamicIdentifiers,
    shouldStop: null,
  });
  let output = await resolve(content, ctx);
  output = evaluateStaticOperators({ context, input: output, refDef });
  return { output, errors: context.errors };
}

const canon = (value) => JSON.parse(JSON.stringify(value ?? null));

async function expectParity({ files, entry, vars = {} }) {
  const compiled = await compileAndRun({ files, entry, vars, collectErrors: true });
  const walked = await resolveWithWalker({ configDir: compiled.configDir, entry, vars });
  expect(canon(compiled.output)).toEqual(canon(walked.output));
  return { compiled, walked };
}

test('parity: nested refs, string ref form, and ref vars', async () => {
  await expectParity({
    files: {
      'lowdefy.yaml': `
id: app
header:
  _ref: shared/header.yaml
pages:
  - _ref:
      path: pages/home.yaml
      vars:
        title: Home title
`,
      'shared/header.yaml': `
type: Header
fixed: true
`,
      'pages/home.yaml': `
id: home
title:
  _var: title
sub:
  _ref:
      path: shared/header.yaml
`,
    },
    entry: 'lowdefy.yaml',
  });
});

test('parity: _var forms — missing null, provided null, defaults, deep paths', async () => {
  await expectParity({
    files: {
      'a.yaml': `
out:
  _ref:
    path: b.yaml
    vars:
      given: g
      nul: null
      deep:
        inner: 9
`,
      'b.yaml': `
given:
  _var: given
missing:
  _var: missing
providedNull:
  _var:
    key: nul
    default: fallback
defaulted:
  _var:
    key: absent
    default: fallback
noDefault:
  _var:
    key: absent
deepGet:
  _var: deep.inner
`,
    },
    entry: 'a.yaml',
  });
});

test('parity: ref vars carrying caller _var and _build operators', async () => {
  await expectParity({
    files: {
      'a.yaml': `
child:
  _ref:
    path: b.yaml
    vars:
      name:
        _var: outer
      flag:
        _build.if:
          test: true
          then: yes-value
          else: no-value
`,
      'b.yaml': `
name:
  _var: name
flag:
  _var: flag
`,
    },
    entry: 'a.yaml',
    vars: { outer: 'from-caller' },
  });
});

test('parity: key pluck — string key and operator-built key, after transformer', async () => {
  await expectParity({
    files: {
      'a.yaml': `
plucked:
  _ref:
    path: b.yaml
    key: section.value
dynamicKey:
  _ref:
    path: b.yaml
    key:
      _build.if:
        test: true
        then: section.value
        else: other
missingKey:
  _ref:
    path: b.yaml
    key: does.not.exist
`,
      'b.yaml': `
section:
  value: 42
other: x
`,
    },
    entry: 'a.yaml',
  });
});

test('parity: transformer order and vars argument', async () => {
  await expectParity({
    files: {
      'a.yaml': `
result:
  _ref:
    path: b.yaml
    transformer: transformers/addKey.js
    key: added.fromVars
    vars:
      v: transformer-input
`,
      'b.yaml': `original: true\n`,
      'transformers/addKey.js': `
export default function addKey(content, vars) {
  return { ...content, added: { fromVars: vars.v } };
}
`,
    },
    entry: 'a.yaml',
  });
});

test('parity: ~ignoreBuildChecks propagates onto included content', async () => {
  await expectParity({
    files: {
      'a.yaml': `
obj:
  _ref:
    path: b.yaml
    '~ignoreBuildChecks':
      - state-refs
list:
  _ref:
    path: c.yaml
    '~ignoreBuildChecks': true
`,
      'b.yaml': `inner: 1\n`,
      'c.yaml': `
- id: one
- plain-string
- id: two
`,
    },
    entry: 'a.yaml',
  });
});

test('parity: dynamic _ref path built by _build operators', async () => {
  await expectParity({
    files: {
      'a.yaml': `
child:
  _ref:
    path:
      _build.string.concat:
        - parts/
        - _var: which
        - .yaml
`,
      'parts/p1.yaml': `part: one\n`,
    },
    entry: 'a.yaml',
    vars: { which: 'p1' },
  });
});

test('parity: _build operator matrix — if, if_none, array.concat, array.compact, env, nunjucks', async () => {
  process.env.PARITY_TEST_ENV = 'parity-env-value';
  await expectParity({
    files: {
      'a.yaml': `
ifTrue:
  _build.if:
    test: true
    then: a
    else: b
ifNone:
  _build.if_none:
    - null
    - fallback
concat:
  _build.array.concat:
    - - 1
    - - 2
      - 3
compact:
  _build.array.compact:
    - keep
    - null
    - also
env:
  _build.env: PARITY_TEST_ENV
templated:
  _build.nunjucks:
    template: '{{ ns }}_upload'
    on:
      ns: pdf
`,
    },
    entry: 'a.yaml',
  });
});

test('parity: runtime operator objects pass through with compiled children', async () => {
  await expectParity({
    files: {
      'a.yaml': `
visible:
  _eq:
    - _state: tab
    - _var: tabName
request:
  _state: form.value
`,
    },
    entry: 'a.yaml',
    vars: { tabName: 'files' },
  });
});

test('parity: conditional list membership via _build.array.compact (the njk replacement idiom)', async () => {
  await expectParity({
    files: {
      'a.yaml': `
blocks:
  _build.array.compact:
    - id: always
    - _build.if:
        test: false
        then:
          id: conditional
        else: null
    - id: last
`,
    },
    entry: 'a.yaml',
  });
});

test('parity: failed ref collects an error and resolves to null in both systems', async () => {
  const compiled = await compileAndRun({
    files: { 'a.yaml': `x:\n  _ref: missing.yaml\nok: 1\n` },
    entry: 'a.yaml',
    collectErrors: true,
  });
  const walked = await resolveWithWalker({ configDir: compiled.configDir, entry: 'a.yaml' });
  expect(canon(compiled.output)).toEqual(canon(walked.output));
  expect(compiled.output).toEqual({ x: null, ok: 1 });
  expect(compiled.errors).toHaveLength(1);
  expect(walked.errors).toHaveLength(1);
  expect(compiled.errors[0].message).toContain('does not exist');
  expect(walked.errors[0].message).toContain('does not exist');
});
