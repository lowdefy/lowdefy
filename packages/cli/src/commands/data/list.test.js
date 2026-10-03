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

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { hashDataSetSpec } from '@lowdefy/node-utils';

import list from './list.js';

let configDirectory;
let context;
let logs;

function writeDataSet(name, content) {
  fs.writeFileSync(path.join(configDirectory, 'tests', 'data', `${name}.yaml`), content);
}

function writeManifest(name, manifest) {
  const directory = path.join(configDirectory, '.lowdefy', 'data', name);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest));
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-data-list-'));
  fs.mkdirSync(path.join(configDirectory, 'tests', 'data'), { recursive: true });
  logs = { info: [], warn: [] };
  context = {
    directories: { config: configDirectory },
    logger: {
      info: (line) => logs.info.push(line),
      warn: (line) => logs.warn.push(line),
    },
    sendTelemetry: jest.fn(),
  };
  jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-03T12:00:00.000Z'));
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('data list prints ages and counts for pulled snapshots and fixtures-only sets', async () => {
  writeDataSet('empty-org', 'users:\n  owner: { id: u_new }\n');
  writeDataSet('staging-sample', 'snapshot:\n  from: staging\n  connections: [tickets]\n');
  writeDataSet('old-sample', 'snapshot:\n  from: staging\n  connections: [tickets]\n');
  writeDataSet('unpulled', 'snapshot:\n  from: staging\n  connections: [tickets]\n');
  const specHash = hashDataSetSpec({ snapshotSpec: { from: 'staging', connections: ['tickets'] } });
  writeManifest('staging-sample', {
    pulledAt: '2026-09-30T08:00:00.000Z',
    specHash,
    collections: { tickets: { connections: ['tickets'], count: 41212, indexes: [] } },
  });
  writeManifest('old-sample', {
    pulledAt: '2026-09-01T08:00:00.000Z',
    specHash: 'changed',
    collections: { tickets: { connections: ['tickets'], count: 1, indexes: [] } },
  });
  await list({ context });
  expect(logs.info).toEqual([
    'empty-org: fixtures only',
    'staging-sample: snapshot from staging, pulled 2026-09-30, 3 days old, 41,212 documents',
  ]);
  expect(logs.warn).toEqual([
    'old-sample: snapshot from staging, pulled 2026-09-01, 32 days old, 1 documents, spec changed: pull again',
    'unpulled: snapshot from staging, not pulled. Run: lowdefy data pull unpulled',
  ]);
  expect(context.sendTelemetry).toHaveBeenCalled();
});

test('data list says how to add a data set when there are none', async () => {
  await list({ context });
  expect(logs.info).toEqual(['No data sets. Add one at tests/data/<name>.yaml.']);
});
