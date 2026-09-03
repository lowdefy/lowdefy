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
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import initMigrations from './initMigrations.js';

let configDirectory;

function testContext({ stages } = {}) {
  const logs = { info: [], warn: [] };
  return {
    logs,
    cliVersion: '8.0.0',
    directories: { config: configDirectory },
    options: { stages },
    logger: {
      info: (msg) => logs.info.push(typeof msg === 'string' ? msg : ''),
      warn: (msg) => logs.warn.push(msg),
    },
    sendTelemetry: async () => {},
  };
}

function read(relativePath) {
  return fs.readFileSync(path.join(configDirectory, relativePath), 'utf8');
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-init-migrations-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('initMigrations writes two workflows and an empty ledger per stage plus the gitignore exception', async () => {
  await initMigrations({ context: testContext() });
  const workflows = fs.readdirSync(path.join(configDirectory, '.github', 'workflows')).sort();
  expect(workflows).toEqual([
    'migrations-dry-run-dev.yml',
    'migrations-dry-run-prod.yml',
    'migrations-run-dev.yml',
    'migrations-run-prod.yml',
  ]);
  expect(JSON.parse(read('.lowdefy/migrations/dev.json'))).toEqual({ stage: 'dev', applied: [] });
  expect(JSON.parse(read('.lowdefy/migrations/prod.json'))).toEqual({ stage: 'prod', applied: [] });
  expect(read('.gitignore')).toContain('!.lowdefy/migrations/');
  expect(read('.gitignore')).toContain('.lowdefy/migrations/local.json');
});

test('initMigrations renders the stage, its branch and the cli version into the workflows', async () => {
  await initMigrations({ context: testContext({ stages: 'staging,prod' }) });
  const run = read('.github/workflows/migrations-run-prod.yml');
  expect(run).toContain('name: Migrations Run — prod');
  expect(run).toContain('branches: [main]');
  expect(run).toContain('group: migrations-prod');
  expect(run).toContain('cancel-in-progress: false');
  expect(run).toContain('environment: prod');
  expect(run).toContain('STAGE: prod');
  expect(run).toContain('npx lowdefy@8.0.0 migrate --yes');
  expect(run).toContain('git add .lowdefy/migrations/prod.json');
  expect(run).toContain('if: always()');
  expect(run).not.toContain('__');
  const dryRun = read('.github/workflows/migrations-dry-run-staging.yml');
  expect(dryRun).toContain('branches: [staging]');
  expect(dryRun).toContain('migrate --dry-run --yes');
  expect(dryRun).toContain('gh pr comment');
  expect(dryRun).not.toContain('__');
});

test('initMigrations never overwrites an existing file and reports the skip', async () => {
  const ledgerDir = path.join(configDirectory, '.lowdefy', 'migrations');
  fs.mkdirSync(ledgerDir, { recursive: true });
  fs.writeFileSync(
    path.join(ledgerDir, 'prod.json'),
    JSON.stringify({ stage: 'prod', applied: [{ id: 'm1', checksum: 'x' }] })
  );
  const context = testContext({ stages: 'prod' });
  await initMigrations({ context });
  expect(JSON.parse(read('.lowdefy/migrations/prod.json')).applied).toHaveLength(1);
  expect(context.logs.warn.join(' ')).toMatch("Skipped '.lowdefy/migrations/prod.json'");
});
