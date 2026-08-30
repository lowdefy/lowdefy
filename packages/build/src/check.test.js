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
import fs from 'fs';
import os from 'os';
import path from 'path';

import { BuildError } from '@lowdefy/errors';

import build, { check } from './index.js';
import { rules } from './checks/index.js';
import { snapshotTypesMap } from './test-utils/runBuildForSnapshots.js';

const silentLogger = { info() {}, log() {}, warn() {}, error() {}, debug() {}, succeed() {} };

function createApp({ lowdefyYaml, customTypesMap = snapshotTypesMap }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-check-test-'));
  const configDirectory = path.join(root, 'config');
  const serverDirectory = path.join(root, '.lowdefy', 'server');
  const buildDirectory = path.join(serverDirectory, 'build');
  fs.mkdirSync(configDirectory, { recursive: true });
  fs.mkdirSync(buildDirectory, { recursive: true });
  fs.writeFileSync(path.join(configDirectory, 'lowdefy.yaml'), lowdefyYaml);
  // The write phase updates the server package.json and copies public_default;
  // check never reaches it, but the build-mode test does.
  fs.writeFileSync(
    path.join(serverDirectory, 'package.json'),
    JSON.stringify({ name: 'server', dependencies: {} })
  );
  fs.mkdirSync(path.join(serverDirectory, 'public_default'));
  return {
    root,
    buildDirectory,
    options: {
      customTypesMap,
      directories: { build: buildDirectory, config: configDirectory, server: serverDirectory },
      logger: silentLogger,
    },
  };
}

const cleanApp = `
lowdefy: 0.0.0-test
pages:
  - id: home
    type: Box
    blocks:
      - id: title
        type: Html
        properties:
          html: Hello
`;

const missingMenuPageApp = `
lowdefy: 0.0.0-test
menus:
  - id: default
    links:
      - id: nowhere
        type: MenuLink
        pageId: does_not_exist
pages:
  - id: home
    type: Box
`;

const badJsApp = `
lowdefy: 0.0.0-test
pages:
  - id: home
    type: Box
    blocks:
      - id: title
        type: Html
        properties:
          html:
            _js: return unlinked.stamp;
`;

const tenantApp = `
lowdefy: 0.0.0-test
auth:
  secret:
    _secret: BETTER_AUTH_SECRET
  emailAndPassword:
    enabled: true
  organizations:
    policy: tenant
connections:
  - id: controls_db
    type: MongoDBCollection
    properties:
      databaseUri: mongodb://localhost/test
      collection: controls
api:
  - id: nightly_sync
    type: Api
    routine:
      - id: read_all_controls
        type: MongoDBFind
        connectionId: controls_db
        tenant: none
        properties:
          query:
            status: active
      - id: read_controls
        type: MongoDBFind
        connectionId: controls_db
        tenant: none
        properties:
          query:
            organization_id:
              _payload: organization_id
      - id: write_control
        type: MongoDBInsertOne
        connectionId: controls_db
        tenant: none
        properties:
          doc:
            name: x
pages:
  - id: controls
    type: Box
    requests:
      - id: get_controls
        type: MongoDBFind
        connectionId: controls_db
        properties:
          query:
            organization_id:
              _user: organization_id
`;

// The snapshot types map carries no connectionMetas; the tenant policy needs
// the MongoDB connection type to declare it implements the wall.
const tenantTypesMap = {
  ...snapshotTypesMap,
  connectionMetas: { MongoDBCollection: { tenant: true } },
};

const created = [];
afterAll(() => {
  created.forEach((root) => fs.rmSync(root, { recursive: true, force: true }));
});

test('check returns no errors and no warnings for a clean app', async () => {
  const app = createApp({ lowdefyYaml: cleanApp });
  created.push(app.root);
  const report = await check(app.options);
  expect(report).toEqual({ errors: [], warnings: [] });
});

test('check writes nothing to the build directory', async () => {
  const app = createApp({ lowdefyYaml: cleanApp });
  created.push(app.root);
  await check(app.options);
  expect(fs.readdirSync(app.buildDirectory)).toEqual([]);
});

test('check reports a prodError warning as an error, not a warning', async () => {
  const app = createApp({ lowdefyYaml: missingMenuPageApp });
  created.push(app.root);
  const report = await check(app.options);
  expect(report.warnings).toEqual([]);
  expect(report.errors).toHaveLength(1);
  expect(report.errors[0]).toEqual({
    message: 'Page "does_not_exist" referenced in menu link "nowhere" not found.',
    name: 'ConfigWarning',
    source: expect.stringContaining('lowdefy.yaml:'),
    config: expect.any(String),
    configKey: expect.any(String),
    checkSlug: 'link-refs',
    prodError: true,
  });
  expect(fs.readdirSync(app.buildDirectory)).toEqual([]);
});

test('build in dev stage reports the same prodError warning as a warning', async () => {
  const app = createApp({ lowdefyYaml: missingMenuPageApp });
  created.push(app.root);
  const report = await build({ ...app.options, stage: 'dev', validateOnly: true });
  expect(report.errors).toEqual([]);
  expect(report.warnings).toHaveLength(1);
  expect(report.warnings[0].prodError).toBe(true);
});

test('check reports a js-lint error located at the _js node', async () => {
  const app = createApp({ lowdefyYaml: badJsApp });
  created.push(app.root);
  const report = await check(app.options);
  expect(report.errors).toHaveLength(1);
  expect(report.errors[0].checkSlug).toBe('js-lint');
  expect(report.errors[0].message).toMatch(/references "unlinked", which is not defined/);
  expect(report.errors[0].source).toMatch(/lowdefy\.yaml:\d+/);
});

test('check runs a checkOnly rule and build skips it', async () => {
  const seen = [];
  rules.push({
    slug: 'test-only',
    checkOnly: true,
    run: ({ context }) => seen.push(context.validateOnly),
  });
  try {
    const checkApp = createApp({ lowdefyYaml: cleanApp });
    created.push(checkApp.root);
    await check(checkApp.options);
    expect(seen).toEqual([true]);

    const buildApp = createApp({ lowdefyYaml: cleanApp });
    created.push(buildApp.root);
    await build(buildApp.options);
    expect(seen).toEqual([true]);
    expect(fs.readdirSync(buildApp.buildDirectory)).not.toEqual([]);
  } finally {
    rules.pop();
  }
});
