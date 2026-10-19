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

import buildConnections from './buildConnections.js';
import validateSharedPipelineWrite from './validateSharedPipelineWrite.js';
import testContext from '../test-utils/testContext.js';

const databaseUri = { _secret: 'MONGODB_URI' };

function buildTenantContext({ policy = 'tenant' } = {}) {
  const context = testContext();
  context.typesMap = {
    connectionMetas: {
      MongoDBCollection: {
        tenant: true,
        tenantTarget: {
          database: ['databaseUri', 'databaseName'],
          collection: 'collection',
          changeLogCollection: 'changeLog.collection',
        },
      },
    },
  };
  buildConnections({
    components: {
      auth: { organizations: { policy } },
      connections: [
        {
          id: 'totals',
          type: 'MongoDBCollection',
          properties: { databaseUri, collection: 'totals' },
        },
        {
          id: 'orders_all',
          type: 'MongoDBCollection',
          tenant: 'shared',
          properties: { databaseUri, collection: 'orders' },
        },
      ],
    },
    context,
  });
  return context;
}

function validate({ context, pipeline, connectionId = 'orders_all' }) {
  return () =>
    validateSharedPipelineWrite({
      config: { connectionId, properties: { pipeline } },
      location: 'Step "rollup" at endpoint "nightly"',
      sharedTargets: context.sharedTargets,
      walledTargets: context.walledTargets,
      configKey: 'key',
    });
}

test.each([
  ['$out', { $out: 'totals' }, '$out'],
  ['$merge', { $merge: 'totals' }, '$merge'],
  ['$merge into', { $merge: { into: 'totals', whenMatched: 'replace' } }, '$merge'],
])(
  'a shared connection aggregation that writes a walled collection with %s is a build error',
  (_, stage, operator) => {
    const context = buildTenantContext();
    expect(
      validate({ context, pipeline: [{ $group: { _id: '$organization_id' } }, stage] })
    ).toThrow(
      `Step "rollup" at endpoint "nightly" writes into collection "totals" with "${operator}" on tenant: shared connection "orders_all", but scoped connection "totals" reads that collection.`
    );
  }
);

test.each([
  ['a collection no scoped connection reads', [{ $out: 'archive' }], 'orders_all'],
  [
    'a target in another database',
    [{ $merge: { into: { db: 'other', coll: 'totals' } } }],
    'orders_all',
  ],
  ['a target named by an operator', [{ $out: { _payload: 'target' } }], 'orders_all'],
  ['a pipeline built by an operator', { _payload: 'pipeline' }, 'orders_all'],
  ['a scoped connection (guarded at runtime)', [{ $out: 'totals' }], 'totals'],
])('the build does not refuse %s', (_, pipeline, connectionId) => {
  const context = buildTenantContext();
  expect(validate({ context, pipeline, connectionId })).not.toThrow();
});

test('the build does not check shared connection writes under the pinned policy', () => {
  const context = buildTenantContext({ policy: 'pinned' });
  expect(validate({ context, pipeline: [{ $out: 'totals' }] })).not.toThrow();
});
