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

import { openTestApp } from '@lowdefy/test-utils';
import { afterAll, beforeAll, expect, test } from 'vitest';

import createBuildHost from '../../src/createBuildHost.js';
import runHeadlessJourney from '../../src/runHeadlessJourney.js';
import journeyFixture from './journeyFixture.mjs';

// A secret set for a run on the build, over a copy of the journey-fixture build in which
// auditor_only answers what it reads from two secrets and whether one equals a field of the
// caller. The fixture app has no endpoint that compares a secret with data, and its journey
// suites count its endpoints, so the app is left as it is.

const user = { id: 'u_org', organization_id: 'org-a', roles: ['auditor'] };
const journey = {
  steps: [{ call: { endpoint: 'auditor_only' } }, { expect: { status: 200 } }],
};

let directory;
let build;

function copyBuildWithSecretEndpoint() {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-journey-headless-secrets-'));
  const configDirectory = path.join(directory, 'config');
  const serverDirectory = path.join(directory, 'server');
  fs.cpSync(journeyFixture.configDirectory, configDirectory, {
    recursive: true,
    preserveTimestamps: true,
    filter: (source) =>
      !source.split(path.sep).some((part) => part === '.lowdefy' || part === 'node_modules'),
  });
  fs.mkdirSync(serverDirectory);
  fs.cpSync(
    path.join(journeyFixture.serverDirectory, 'build'),
    path.join(serverDirectory, 'build'),
    { recursive: true, preserveTimestamps: true }
  );
  fs.symlinkSync(
    path.join(journeyFixture.serverDirectory, 'node_modules'),
    path.join(serverDirectory, 'node_modules'),
    'dir'
  );
  const endpointPath = path.join(serverDirectory, 'build', 'api', 'auditor_only.json');
  const endpoint = JSON.parse(fs.readFileSync(endpointPath, 'utf8'));
  endpoint.routine = [
    {
      ':return': {
        match: { _eq: [{ _secret: 'ORG_ID' }, { _user: 'organization_id' }] },
        orgId: { _secret: 'ORG_ID' },
        other: { _secret: 'OTHER_KEY' },
      },
    },
  ];
  fs.writeFileSync(endpointPath, JSON.stringify(endpoint));
  // The build holds only the operators the app's config names, and the fixture names no _eq.
  const operatorsPath = path.join(serverDirectory, 'build', 'plugins', 'operators', 'server.js');
  fs.writeFileSync(
    operatorsPath,
    fs
      .readFileSync(operatorsPath, 'utf8')
      .replace(
        'export default {',
        "import { _eq as _eq } from '@lowdefy/operators-js/operators/server';\nexport default {\n  _eq,"
      )
  );
  // Written after the config, so the copied build is as fresh as the original.
  const later = new Date(Date.now() + 1000);
  fs.utimesSync(path.join(serverDirectory, 'build', 'refMap.json'), later, later);
  return { configDirectory, serverDirectory };
}

beforeAll(() => {
  build = copyBuildWithSecretEndpoint();
});

afterAll(() => {
  if (directory) fs.rmSync(directory, { recursive: true, force: true });
});

test('a journey reads the value a run sets for a secret, and the stand-in for one it does not', async () => {
  const app = await openTestApp({ ...build, secrets: { ORG_ID: 'org-a' } });
  let result;
  try {
    const host = await createBuildHost({ app, user });
    result = await runHeadlessJourney({
      host,
      journey: {
        steps: [
          ...journey.steps,
          { expect: { calls: { endpoint: 'auditor_only', response: { match: true } } } },
        ],
      },
      stepTimeout: 2000,
    });
    await host.close();
  } finally {
    await app.close();
  }
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.calls.map(({ response }) => response)).toEqual([
    { match: true, orgId: 'org-a', other: 'test-secret-OTHER_KEY' },
  ]);
});

test('a journey reads the stand-in for every secret when the run sets none', async () => {
  const app = await openTestApp(build);
  let result;
  try {
    const host = await createBuildHost({ app, user });
    result = await runHeadlessJourney({ host, journey, stepTimeout: 2000 });
    await host.close();
  } finally {
    await app.close();
  }
  expect(result.passed).toBe(true);
  expect(result.calls.map(({ response }) => response)).toEqual([
    { match: false, orgId: 'test-secret-ORG_ID', other: 'test-secret-OTHER_KEY' },
  ]);
});
