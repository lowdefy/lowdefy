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

import assert from 'node:assert/strict';
import { test } from 'node:test';

import findUndeclaredImports from './findUndeclaredImports.mjs';

const packageJson = JSON.stringify({
  name: '@lowdefy/example',
  files: ['dist/*'],
  exports: { '.': './dist/index.js', './e2e': './dist/e2e.js' },
  dependencies: { dep: '1.0.0' },
  peerDependencies: { react: '>=18' },
  optionalDependencies: { optional: '1.0.0' },
  devDependencies: { devdep: '1.0.0', '@playwright/test': '1.0.0' },
});

function check(files) {
  return findUndeclaredImports({
    files: { 'packages/example/package.json': packageJson, ...files },
  }).map(({ filePath, name, problem }) => [
    filePath.replace('packages/example/', ''),
    name,
    problem,
  ]);
}

const cases = [
  {
    name: 'accepts dependencies, peers, optionals, builtins, relative, self and alias imports',
    files: {
      'src/index.js': [
        "import dep from 'dep/sub/path.js';",
        "import React from 'react';",
        "import fs from 'fs';",
        "import path from 'node:path';",
        "import local from './local.js';",
        "import self from '@lowdefy/example/e2e';",
        "import alias from '@/components/Nav.js';",
        "const optional = await import('optional');",
      ].join('\n'),
    },
    expected: [],
  },
  {
    name: 'flags an undeclared package in every import form',
    files: {
      'src/index.js': [
        "import a from 'undeclared-a';",
        "export { b } from '@scope/undeclared-b';",
        "const c = await import('undeclared-c');",
        "const d = require('undeclared-d');",
        "const e = require.resolve('undeclared-e/package.json');",
        'const f = await import(`undeclared-f`);',
        'const g = require(`undeclared-g`);',
        'const h = await import(`undeclared-h/${name}`);',
      ].join('\n'),
    },
    expected: [
      ['src/index.js', 'undeclared-a', 'undeclared'],
      ['src/index.js', '@scope/undeclared-b', 'undeclared'],
      ['src/index.js', 'undeclared-c', 'undeclared'],
      ['src/index.js', 'undeclared-d', 'undeclared'],
      ['src/index.js', 'undeclared-e', 'undeclared'],
      ['src/index.js', 'undeclared-f', 'undeclared'],
      ['src/index.js', 'undeclared-g', 'undeclared'],
    ],
  },
  {
    name: 'ignores import-shaped text in strings and comments',
    files: {
      'src/index.js': [
        "// import a from 'undeclared-a';",
        'const code = "import b from \'undeclared-b\';";',
        'const template = `${"import"}(\'undeclared-c\')`;',
      ].join('\n'),
    },
    expected: [],
  },
  {
    name: 'flags a devDependency imported by a published file',
    files: { 'src/index.js': "import devdep from 'devdep';" },
    expected: [['src/index.js', 'devdep', 'devDependency']],
  },
  {
    name: 'allows devDependencies in tests and unpublished files, but not undeclared packages',
    files: {
      'src/index.test.js': "import devdep from 'devdep';\nimport { jest } from '@jest/globals';",
      'src/test/helper.js': "import devdep from 'devdep';",
      'scripts/generate.mjs': "import devdep from 'devdep';",
    },
    expected: [['src/index.test.js', '@jest/globals', 'undeclared']],
  },
  {
    name: 'allows devDependencies in e2e helpers reachable from the e2e export only',
    files: {
      'src/e2e.js': "export { default as Button } from './blocks/Button/e2e.js';",
      'src/blocks/Button/e2e.js':
        "import { expect } from '@playwright/test';\nimport shared from '../../e2eShared.js';",
      'src/e2eShared.js': "import devdep from 'devdep';",
      'src/blocks/Card/e2e.js': "import { expect } from '@playwright/test';",
    },
    expected: [['src/blocks/Card/e2e.js', '@playwright/test', 'devDependency']],
  },
];

cases.forEach(({ name, files, expected }) => {
  test(name, () => {
    const prefixed = Object.fromEntries(
      Object.entries(files).map(([filePath, content]) => [`packages/example/${filePath}`, content])
    );
    assert.deepEqual(check(prefixed), expected);
  });
});

test('allows devDependencies anywhere in a private package', () => {
  const problems = findUndeclaredImports({
    files: {
      'packages/site/package.json': JSON.stringify({
        name: 'site',
        private: true,
        devDependencies: { devdep: '1.0.0' },
      }),
      'packages/site/src/index.js': "import devdep from 'devdep';",
    },
  });
  assert.deepEqual(problems, []);
});

test('reports a source file that belongs to no package', () => {
  const problems = findUndeclaredImports({
    files: { 'packages/removed/src/e2e.js': "import x from 'x';" },
  });
  assert.deepEqual(problems, [
    { filePath: 'packages/removed/src/e2e.js', problem: 'outsidePackage' },
  ]);
});

test('names the file when it cannot be parsed', () => {
  assert.throws(
    () =>
      findUndeclaredImports({
        files: {
          'packages/example/package.json': packageJson,
          'packages/example/src/a.js': 'import (',
        },
      }),
    /Could not parse packages\/example\/src\/a\.js/
  );
});
