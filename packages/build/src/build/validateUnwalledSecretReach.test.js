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

import { ConfigError } from '@lowdefy/errors';

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

function build(connections, { policy = 'tenant', keyMap = {} } = {}) {
  const context = testContext();
  context.typesMap = { connectionMetas };
  context.errors = [];
  context.warnings = [];
  context.keyMap = keyMap;
  buildConnections({
    components: { auth: { organizations: { policy } }, connections },
    context,
  });
  return context;
}

// buildConnections mutates the connections it builds, so each test gets its own.
function walled(id = 'rows') {
  return {
    id,
    type: 'Mongo',
    properties: { databaseUri: { _secret: 'MONGO_URI' }, collection: 'rows' },
  };
}

const sneakyMessage =
  'Connection "sneaky" (Plugin) reads secret "MONGO_URI", the database of walled connection "rows". Unwalled connections must not reach walled data: give the plugin a mongoConnectionId and use the walled MongoDB client (@lowdefy/connection-mongodb/walled).';

test('an unscoped connection reading the walled secret is a build error', () => {
  const context = build([
    walled(),
    {
      id: 'sneaky',
      type: 'Plugin',
      properties: { nested: { uri: { _secret: 'MONGO_URI' } } },
      '~k': 'k-sneaky',
    },
  ]);
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0]).toBeInstanceOf(ConfigError);
  expect(context.errors[0].message).toBe(sneakyMessage);
  expect(context.errors[0].configKey).toBe('k-sneaky');
  expect(context.warnings).toEqual([]);
});

test('the build error throws when the build collects no errors', () => {
  const context = testContext();
  context.typesMap = { connectionMetas };
  expect(() =>
    buildConnections({
      components: {
        auth: { organizations: { policy: 'tenant' } },
        connections: [
          walled(),
          { id: 'sneaky', type: 'Plugin', properties: { uri: { _secret: 'MONGO_URI' } } },
        ],
      },
      context,
    })
  ).toThrow(sneakyMessage);
});

test('~ignoreBuildChecks does not suppress the error', () => {
  const context = build(
    [
      walled(),
      {
        id: 'sneaky',
        type: 'Plugin',
        properties: { uri: { _secret: 'MONGO_URI' } },
        '~k': 'k-sneaky',
      },
    ],
    { keyMap: { 'k-sneaky': { '~ignoreBuildChecks': true } } }
  );
  expect(context.errors.map((error) => error.message)).toEqual([sneakyMessage]);
});

test('SMTP and a plugin on a different secret are not refused', () => {
  const context = build([
    walled(),
    { id: 'mail', type: 'Smtp', properties: { host: 'smtp.x', pass: { _secret: 'SMTP_PASS' } } },
    { id: 'other', type: 'Plugin', properties: { uri: { _secret: 'OTHER_DB' } } },
    { id: 'walled_plugin', type: 'Plugin', properties: { mongoConnectionId: 'rows' } },
  ]);
  expect(context.errors).toEqual([]);
});

test('a scopable connection sharing the secret is not an unwalled reach', () => {
  const context = build([walled(), walled('rows_2')]);
  expect(context.errors).toEqual([]);
});

test('nothing is checked under the pinned policy', () => {
  const context = build(
    [walled(), { id: 'sneaky', type: 'Plugin', properties: { uri: { _secret: 'MONGO_URI' } } }],
    { policy: 'pinned' }
  );
  expect(context.errors).toEqual([]);
});
