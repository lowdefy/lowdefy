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
import testContext from '../test-utils/testContext.js';

const connectionMetas = {
  Mongo: {
    tenant: true,
    tenantTarget: { database: ['databaseUri', 'databaseName'], collection: 'collection' },
  },
  Smtp: { tenant: false },
  Plugin: { tenant: false },
};

function build(connections, policy = 'tenant') {
  const context = testContext();
  context.typesMap = { connectionMetas };
  context.warnings = [];
  buildConnections({
    components: { auth: { organizations: { policy } }, connections },
    context,
  });
  return context.warnings.map((warning) => warning.message);
}

const walled = {
  id: 'rows',
  type: 'Mongo',
  properties: { databaseUri: { _secret: 'MONGO_URI' }, collection: 'rows' },
};

test('an unscoped connection reading the walled secret warns', () => {
  const warnings = build([
    walled,
    { id: 'sneaky', type: 'Plugin', properties: { nested: { uri: { _secret: 'MONGO_URI' } } } },
  ]);
  expect(warnings).toEqual([
    'Connection "sneaky" (Plugin) reads secret "MONGO_URI", the database of walled connection "rows". Unwalled connections must not reach walled data: give the plugin a mongoConnectionId and use the walled MongoDB client (@lowdefy/connection-mongodb/walled). This becomes a build error in the next release.',
  ]);
});

test('SMTP and a plugin on a different secret do not warn', () => {
  expect(
    build([
      walled,
      { id: 'mail', type: 'Smtp', properties: { host: 'smtp.x', pass: { _secret: 'SMTP_PASS' } } },
      { id: 'other', type: 'Plugin', properties: { uri: { _secret: 'OTHER_DB' } } },
      { id: 'walled_plugin', type: 'Plugin', properties: { mongoConnectionId: 'rows' } },
    ])
  ).toEqual([]);
});

test('a scopable connection sharing the secret is not an unwalled reach', () => {
  expect(
    build([walled, { ...walled, id: 'rows_2', properties: { ...walled.properties } }])
  ).toEqual([]);
});

test('nothing is checked under the pinned policy', () => {
  expect(
    build(
      [walled, { id: 'sneaky', type: 'Plugin', properties: { uri: { _secret: 'MONGO_URI' } } }],
      'pinned'
    )
  ).toEqual([]);
});
