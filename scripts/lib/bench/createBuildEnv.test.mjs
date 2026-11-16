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

import createBuildEnv from './createBuildEnv.mjs';

test('createBuildEnv keeps the caller NODE_OPTIONS and adds only the pin by default', () => {
  const env = createBuildEnv({ env: { CI: 'true', NODE_OPTIONS: '--max-old-space-size=8192' } });
  assert.match(env.NODE_OPTIONS, /^--max-old-space-size=8192 --import=file:.*pinBuildInputs\.mjs$/);
  assert.equal(env.LOWDEFY_GIT_SHA, 'bench');
  assert.equal(env.CI, undefined);
  assert.equal(env.LOWDEFY_BENCH_PROBE_FILE, undefined);
});

test('createBuildEnv loads the probe after the pin and names its file', () => {
  const env = createBuildEnv({ env: {}, probeFile: '/runs/probe/current-run-1.jsonl' });
  assert.match(
    env.NODE_OPTIONS,
    /^--import=file:.*pinBuildInputs\.mjs --import=file:.*probe\.mjs$/
  );
  assert.equal(env.LOWDEFY_BENCH_PROBE_FILE, '/runs/probe/current-run-1.jsonl');
});

test('createBuildEnv turns on CPU profiles in a quoted directory', () => {
  const env = createBuildEnv({ cpuProfileDirectory: '/runs/my app/profiles', env: {} });
  assert.ok(env.NODE_OPTIONS.endsWith(' --cpu-prof --cpu-prof-dir="/runs/my app/profiles"'));
});
