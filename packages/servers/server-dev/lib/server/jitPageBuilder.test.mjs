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
import { jest } from '@jest/globals';
import { ConfigError } from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';

import buildPageIfNeeded, { getBuildContext } from './jitPageBuilder.js';
import createHandleError from './log/createHandleError.js';
import readMergedMaps from './readMergedMaps.js';

// The dev page build context restores the tenant facts the skeleton build
// wrote, so page requests get the same tenant pipeline checks as a full build.
test('getBuildContext restores the scoped connections, walled collections and shared connections', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-jit-context-'));
  const buildDirectory = path.join(root, 'build');
  fs.mkdirSync(buildDirectory, { recursive: true });
  const walledKey = JSON.stringify(['MongoDBCollection', ['uri'], 'totals']);
  const shared = {
    connection: { type: 'MongoDBCollection', properties: { databaseUri: 'uri' } },
    tenantTarget: { database: ['databaseUri'], collection: 'collection' },
  };
  fs.writeFileSync(
    path.join(buildDirectory, 'idCounter.json'),
    JSON.stringify({ prefix: 'test_', counter: 0 })
  );
  fs.writeFileSync(
    path.join(buildDirectory, 'tenantTargets.json'),
    serializer.serializeToString({
      tenantConnectionIds: ['totals'],
      walledTargets: [[walledKey, { connectionId: 'totals', field: 'organization_id' }]],
      sharedTargets: [['orders_all', shared]],
    })
  );

  const context = getBuildContext(buildDirectory, path.join(root, 'config'));

  expect([...context.tenantConnectionIds]).toEqual(['totals']);
  expect(context.walledTargets.get(walledKey)).toEqual({
    connectionId: 'totals',
    field: 'organization_id',
  });
  expect(context.sharedTargets.get('orders_all')).toEqual(shared);
});

// A JIT page build loads the build package's plugins on first use.
jest.setTimeout(30000);

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data));
}

// A config build's output, as far as a JIT page build reads it.
function createApp({ pages }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-jit-maps-'));
  const buildDirectory = path.join(root, 'server', 'build');
  const configDirectory = path.join(root, 'config');
  writeJson(path.join(buildDirectory, 'idCounter.json'), { prefix: 'cfg1_', counter: 10 });
  writeJson(path.join(buildDirectory, 'keyMap.json'), {
    cfg1_1: { key: 'root', '~r': 'cfg1_r' },
  });
  writeJson(path.join(buildDirectory, 'refMap.json'), {
    cfg1_r: { parent: null, path: 'lowdefy.yaml' },
  });
  writeJson(path.join(buildDirectory, 'installedPluginPackages.json'), [
    '@lowdefy/actions-core',
    '@lowdefy/blocks-antd',
    '@lowdefy/blocks-basic',
    '@lowdefy/operators-js',
  ]);
  writeJson(path.join(buildDirectory, 'theme.json'), {});
  const registry = {};
  for (const [pageId, content] of Object.entries(pages)) {
    fs.mkdirSync(path.join(configDirectory, 'pages'), { recursive: true });
    fs.writeFileSync(path.join(configDirectory, 'pages', `${pageId}.yaml`), content);
    registry[pageId] = {
      pageId,
      auth: { public: true },
      refId: `ref-${pageId}`,
      refPath: `pages/${pageId}.yaml`,
    };
  }
  writeJson(path.join(buildDirectory, 'pageRegistry.json'), registry);
  return { root, buildDirectory, configDirectory };
}

function listJitMaps(buildDirectory) {
  const directory = path.join(buildDirectory, 'jitMaps');
  return fs.existsSync(directory) ? fs.readdirSync(directory).sort() : [];
}

function invalidatePages(buildDirectory, time) {
  const filePath = path.join(buildDirectory, 'invalidatePages');
  fs.writeFileSync(filePath, String(time));
  fs.utimesSync(filePath, time, time);
}

test('a JIT page build leaves keyMap.json and refMap.json as the config build wrote them', async () => {
  const { root, buildDirectory, configDirectory } = createApp({
    pages: { home: 'id: home\ntype: Box\nblocks:\n  - id: title\n    type: Box\n' },
  });
  const keyMapBefore = fs.readFileSync(path.join(buildDirectory, 'keyMap.json'), 'utf8');
  const refMapBefore = fs.readFileSync(path.join(buildDirectory, 'refMap.json'), 'utf8');

  await buildPageIfNeeded({ pageId: 'home', buildDirectory, configDirectory });

  expect(fs.readFileSync(path.join(buildDirectory, 'keyMap.json'), 'utf8')).toBe(keyMapBefore);
  expect(fs.readFileSync(path.join(buildDirectory, 'refMap.json'), 'utf8')).toBe(refMapBefore);
  const files = listJitMaps(buildDirectory);
  expect(files).toHaveLength(1);
  expect(files[0]).toMatch(/^[0-9a-f]{6}-\d+-1\.json$/);
  const { keyMap } = await readMergedMaps({ buildDirectory });
  const titleKey = Object.keys(keyMap).find((key) => keyMap[key].key?.includes('title'));
  // Config build prefix, then this process's id: <cfg prefix><child id>_<counter>.
  expect(titleKey).toMatch(/^cfg1_[0-9a-f]{6}_[0-9a-z]+$/);
  fs.rmSync(root, { recursive: true, force: true });
});

test('an error a failing JIT page build throws after its keys were added resolves to its source line', async () => {
  const { root, buildDirectory, configDirectory } = createApp({
    pages: {
      broken:
        'id: broken\ntype: Box\nblocks:\n  - id: button\n    type: Button\n    events:\n' +
        '      onClick:\n        - id: act\n          type: UndefinedAction\n',
    },
  });

  const error = await buildPageIfNeeded({
    pageId: 'broken',
    buildDirectory,
    configDirectory,
  }).catch((caught) => caught);
  const buildError = (error.buildErrors ?? [error]).find((item) => item.configKey);
  const context = {
    configDirectory,
    logger: { error: jest.fn() },
    readConfigFile: jest.fn(),
    readMaps: () => readMergedMaps({ buildDirectory }),
  };
  // A fresh copy, as the request that logs it would see it.
  const logged = new ConfigError(buildError.message, { configKey: buildError.configKey });
  await createHandleError({ context })(logged);

  expect(logged.source).toBe(`${path.join(configDirectory, 'pages', 'broken.yaml')}:8`);
  fs.rmSync(root, { recursive: true, force: true });
});

test('after two page edits only the current and previous build contexts keep jitMaps files', async () => {
  const { root, buildDirectory, configDirectory } = createApp({
    pages: {
      a: 'id: a\ntype: Box\n',
      b: 'id: b\ntype: Box\n',
      c: 'id: c\ntype: Box\n',
    },
  });

  await buildPageIfNeeded({ pageId: 'a', buildDirectory, configDirectory });
  const [first] = listJitMaps(buildDirectory);
  invalidatePages(buildDirectory, 1000);
  await buildPageIfNeeded({ pageId: 'b', buildDirectory, configDirectory });
  invalidatePages(buildDirectory, 2000);
  await buildPageIfNeeded({ pageId: 'c', buildDirectory, configDirectory });

  const files = listJitMaps(buildDirectory);
  expect(files).toHaveLength(2);
  expect(files).not.toContain(first);
  const generations = files.map((file) => Number(file.split('-')[1]));
  expect(generations[1] - generations[0]).toBe(1);
  fs.rmSync(root, { recursive: true, force: true });
});
