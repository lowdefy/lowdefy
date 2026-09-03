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

import resolveMigrationPreflight from './resolveMigrationPreflight.js';

function testContext({ config, artifacts = {} }) {
  const warnings = [];
  return {
    warnings,
    config,
    logger: { info: () => {}, warn: (msg) => warnings.push(msg) },
    readConfigFile: async (filePath) => artifacts[filePath],
  };
}

test('resolveMigrationPreflight resolves without probing when preflight is opted out', async () => {
  const context = testContext({ config: { migrations: { preflight: false } } });
  await expect(resolveMigrationPreflight(context)).resolves.toBeUndefined();
});

test('resolveMigrationPreflight resolves when the index is empty', async () => {
  const context = testContext({ config: {}, artifacts: { 'migrations.json': [] } });
  await expect(resolveMigrationPreflight(context)).resolves.toBeUndefined();
});

test('resolveMigrationPreflight warns and resolves when there is no index artifact (stale build)', async () => {
  const context = testContext({ config: {}, artifacts: {} });
  await resolveMigrationPreflight(context);
  expect(context.warnings.join(' ')).toMatch('Migration preflight skipped');
});

test('resolveMigrationPreflight memoizes per config so it runs once', async () => {
  let reads = 0;
  const config = {};
  const context = {
    config,
    logger: { info: () => {}, warn: () => {} },
    readConfigFile: async () => {
      reads += 1;
      return [];
    },
  };
  await resolveMigrationPreflight(context);
  await resolveMigrationPreflight(context);
  expect(reads).toBe(1);
});
