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

import buildApi from '../buildApi.js';
import validateStep from './validateStep.js';
import testContext from '../../../test-utils/testContext.js';

// The tenant indexes reach validateStep through buildApi -> buildEndpoint ->
// buildRoutine -> buildStep, four hops that no unit test of the walker covers.
function endpointComponents() {
  return {
    api: [
      {
        id: 'sync',
        type: 'Api',
        routine: [
          {
            ':if': true,
            ':then': [
              {
                id: 'join_frameworks',
                type: 'MongoDBAggregation',
                connectionId: 'org_scope',
                '~k': 'k_join',
                properties: {
                  pipeline: [{ $lookup: { from: 'catalogue', as: 'c' } }],
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

test('the tenant indexes reach validateStep, so a step joining a shared collection is an error', () => {
  const context = testContext();
  context.errors = [];
  context.tenantConnections = new Map([
    ['org_scope', { type: 'MongoDBCollection', field: 'organization_id' }],
  ]);
  context.tenantCollectionMap = { catalogue: { shared: ['frameworks'], scoped: [] } };
  buildApi({ components: endpointComponents(), context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain(
    'Step "join_frameworks" at endpoint "sync" uses "$lookup" on collection "catalogue" over tenant connection "org_scope"'
  );
  expect(context.errors[0].checkSlug).toBe('tenant-lookup');
});

test('a step on a walled connection with a clean pipeline builds', () => {
  const context = testContext();
  context.errors = [];
  context.tenantConnections = new Map([
    ['org_scope', { type: 'MongoDBCollection', field: 'organization_id' }],
  ]);
  context.tenantCollectionMap = { catalogue: { shared: [], scoped: ['org_scope'] } };
  buildApi({ components: endpointComponents(), context });
  expect(context.errors).toEqual([]);
});

test('validateStep throws the first finding so buildApi can collect it', () => {
  expect(() =>
    validateStep(
      {
        id: 'search_controls',
        type: 'MongoDBAggregation',
        connectionId: 'org_scope',
        '~k': 'k1',
        properties: { pipeline: [{ $search: { text: 'a' } }] },
      },
      {
        endpointId: 'sync',
        stepTypes: {},
        tenantConnections: new Map([
          ['org_scope', { type: 'MongoDBCollection', field: 'organization_id' }],
        ]),
        tenantCollectionMap: {},
      }
    )
  ).toThrow('contains "$search" in its pipeline on tenant connection "org_scope"');
});
