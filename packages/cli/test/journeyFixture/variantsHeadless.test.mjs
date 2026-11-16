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

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { createBuildHost, runHeadlessJourney } from '@lowdefy/journey-headless';
import { parseDataSet } from '@lowdefy/node-utils';
import { beforeAll, expect, test } from 'vitest';

import buildVariantJourney from '../../src/commands/journeys/variants/buildVariantJourney.js';
import roleRefused from '../../src/commands/journeys/variants/generators/roleRefused.js';
import validateJourney from '../../src/commands/test/validateJourney.js';

// Variants run headless: the call-based roleRefused variant, generated for a journey on a page
// whose request is gated to a role, passes on a production build of apps/journey-fixture.

const execFileAsync = promisify(execFile);
const configDirectory = process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY;
const fixtureTest = configDirectory === undefined ? test.skip : test;
const repositoryRoot = path.resolve(fileURLToPath(new URL('../../../..', import.meta.url)));
// A server copy of its own, so no other fixture file builds into it at the same time.
const serverDirectory = path.join(repositoryRoot, '_server', 'cli-variants-journey-fixture');

beforeAll(async () => {
  if (configDirectory === undefined) return;
  await execFileAsync(
    process.execPath,
    [
      path.join(repositoryRoot, 'scripts', 'build.mjs'),
      '--skip-build',
      '--no-client-build',
      '--log-level',
      'error',
      '--config-directory',
      configDirectory,
      '--server-directory',
      serverDirectory,
    ],
    { cwd: repositoryRoot, maxBuffer: 64 * 1024 * 1024 }
  );
});

// A copy of the build in which page home and its save_item request are gated to the auditor role,
// as the fixture app has no role-gated page with a request.
function copyBuildWithGatedPage() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-cli-role-variant-'));
  const copyConfig = path.join(directory, 'config');
  const copyServer = path.join(directory, 'server');
  fs.cpSync(configDirectory, copyConfig, {
    recursive: true,
    preserveTimestamps: true,
    filter: (source) =>
      !source.split(path.sep).some((part) => part === '.lowdefy' || part === 'node_modules'),
  });
  fs.mkdirSync(copyServer);
  fs.cpSync(path.join(serverDirectory, 'build'), path.join(copyServer, 'build'), {
    recursive: true,
    preserveTimestamps: true,
  });
  fs.symlinkSync(
    path.join(serverDirectory, 'node_modules'),
    path.join(copyServer, 'node_modules'),
    'dir'
  );
  const gated = { public: false, roles: ['auditor'] };
  ['pages/home.json', 'pages/home/requests/save_item.json'].forEach((name) => {
    const filePath = path.join(copyServer, 'build', name);
    const artifact = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    artifact.auth = gated;
    fs.writeFileSync(filePath, JSON.stringify(artifact));
  });
  const later = new Date(Date.now() + 1000);
  fs.utimesSync(path.join(copyServer, 'build', 'refMap.json'), later, later);
  return {
    configDirectory: copyConfig,
    serverDirectory: copyServer,
    pageAuth: gated,
    remove: () => fs.rmSync(directory, { recursive: true, force: true }),
  };
}

fixtureTest(
  'roleRefused on a page with a role-gated request writes a call-based variant that passes headless',
  async () => {
    const copy = copyBuildWithGatedPage();
    let host;
    try {
      const journey = {
        name: 'an auditor saves an item',
        pageId: 'home',
        data: 'roles',
        user: 'auditor',
        steps: [
          { fill: { blockId: 'name_input', value: 'Audited item' } },
          { click: 'save_button' },
          { wait: { request: 'save_item' } },
          { expect: { state: { path: 'saved', equals: true } } },
        ],
      };
      const dataSet = await parseDataSet({ configDirectory: copy.configDirectory, name: 'roles' });
      const variants = roleRefused({
        journey,
        dataSet,
        exercised: {
          requests: [{ pageId: 'home', requestId: 'save_item', calls: 1, write: true }],
        },
        pageConfigs: [{ auth: copy.pageAuth }],
      });
      const variantJourney = buildVariantJourney({ journey, variant: variants[1] });
      expect(variantJourney).toEqual({
        name: 'an auditor saves an item — role: requests refused to member',
        data: 'roles',
        user: 'member',
        variant: {
          of: 'an auditor saves an item',
          kind: 'role',
          detail: 'requests refused to member',
        },
        steps: [
          { request: { pageId: 'home', requestId: 'save_item', payload: {} } },
          { expect: { status: 403 } },
        ],
      });
      expect(validateJourney({ journey: variantJourney }).valid).toBe(true);
      host = await createBuildHost({
        configDirectory: copy.configDirectory,
        data: 'roles',
        serverDirectory: copy.serverDirectory,
        user: variantJourney.user,
      });
      const result = await runHeadlessJourney({ host, journey: variantJourney });
      expect(result.failure).toBeUndefined();
      expect(result.passed).toBe(true);
      expect(result.calls).toEqual([
        expect.objectContaining({ kind: 'request', requestId: 'save_item', status: 403 }),
      ]);
    } finally {
      await host?.close();
      copy.remove();
    }
  }
);
