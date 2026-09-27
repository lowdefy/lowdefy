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
import { serializer } from '@lowdefy/helpers';

import { getBuildContext } from './jitPageBuilder.js';

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
