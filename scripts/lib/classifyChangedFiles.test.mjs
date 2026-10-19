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

import classifyChangedFiles from './classifyChangedFiles.mjs';

test('classifyChangedFiles leaves a change inside one package to the affected filter', () => {
  assert.deepEqual(
    classifyChangedFiles({
      files: ['packages/plugins/operators/operators-uuid/src/operators/shared/uuid.js'],
    }),
    { all: false, reason: null, website: false }
  );
});

test('classifyChangedFiles falls back to every package when the lockfile changes', () => {
  assert.deepEqual(classifyChangedFiles({ files: ['packages/api/src/a.js', 'pnpm-lock.yaml'] }), {
    all: true,
    reason: 'pnpm-lock.yaml is outside the workspace packages',
    website: true,
  });
});

test('classifyChangedFiles falls back to every package for root config, workflows and scripts', () => {
  [
    'package.json',
    'turbo.json',
    'pnpm-workspace.yaml',
    '.swcrc',
    '.eslintrc.yaml',
    '.github/workflows/test-fast.yml',
    'scripts/lib/startJourneyFixture.mjs',
    'apps/journey-fixture/lowdefy.yaml',
    'patches/buffer-equal-constant-time@1.0.1.patch',
  ].forEach((file) => {
    assert.equal(classifyChangedFiles({ files: [file] }).all, true, file);
  });
});

test('classifyChangedFiles ignores docs-only files', () => {
  assert.deepEqual(
    classifyChangedFiles({
      files: [
        'README.md',
        'CLAUDE.md',
        'code-docs/testing.md',
        '.changeset/brave-cats.md',
        '.claude/skills/x/SKILL.md',
        'packages/api/CHANGELOG.md',
        'packages/build/README.md',
      ],
    }),
    { all: false, reason: null, website: false }
  );
});

test('classifyChangedFiles keeps markdown inside packages that tests read', () => {
  assert.deepEqual(
    classifyChangedFiles({ files: ['packages/docs-content/content/operators/_if.md'] }),
    { all: false, reason: null, website: false }
  );
});

test('classifyChangedFiles builds the website only when it changes', () => {
  assert.deepEqual(classifyChangedFiles({ files: ['packages/website/app/page.js'] }), {
    all: false,
    reason: null,
    website: true,
  });
});
