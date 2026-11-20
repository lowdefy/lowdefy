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
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import summarizeCpuProfiles from './summarizeCpuProfiles.mjs';

// A config pass's profile in V8's .cpuprofile format: one sample in yaml's
// compose-node.js lasts 2 ms, one in @lowdefy/build's addKeys.js 2 ms.
const profile = JSON.parse(
  fs.readFileSync(path.join(import.meta.dirname, 'fixtures/config-pass.cpuprofile'), 'utf8')
);

const packages = {
  '/bench/server/node_modules/.pnpm/yaml@2.8.1/node_modules/yaml': 'yaml',
  '/bench/lowdefy/packages/build': '@lowdefy/build',
  '/bench/server': '@lowdefy/server',
};

function packageOf(filePath) {
  const root = Object.keys(packages).find((directory) => filePath.startsWith(`${directory}/`));
  return root === undefined ? null : { name: packages[root], root };
}

test('summarizeCpuProfiles gives self time per package, @lowdefy/build file and runtime entry', () => {
  assert.deepEqual(summarizeCpuProfiles({ packageOf, profiles: [profile] }), {
    durationMs: 6.5,
    packages: {
      yaml: 2,
      '@lowdefy/build': 2,
      '(node)': 0.5,
      '@lowdefy/server': 0.3,
      '(native)': 0.5,
    },
    buildFiles: { 'dist/build/addKeys.js': 2 },
    runtime: { '(garbage collector)': 0.5, '(program)': 0.5, '(idle)': 0.2 },
  });
});

test('summarizeCpuProfiles sums the profiles of several config passes', () => {
  const summary = summarizeCpuProfiles({ packageOf, profiles: [profile, profile] });
  assert.equal(summary.durationMs, 13);
  assert.equal(summary.packages.yaml, 4);
  assert.equal(summary.buildFiles['dist/build/addKeys.js'], 4);
  assert.equal(summary.runtime['(garbage collector)'], 1);
});

test('summarizeCpuProfiles counts a file outside any package as (no package)', () => {
  const summary = summarizeCpuProfiles({ packageOf: () => null, profiles: [profile] });
  assert.equal(summary.packages['(no package)'], 4.3);
  assert.deepEqual(summary.buildFiles, {});
});
