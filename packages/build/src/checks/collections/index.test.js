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

import collectionsRules from './index.js';
import buildCollections from '../../build/buildCollections.js';
import buildConnections from '../../build/buildConnections.js';
import testContext from '../../test-utils/testContext.js';

function check(components) {
  const context = testContext({ logger: { debug: () => {} } });
  context.errors = [];
  context.warnings = [];
  context.handleWarning = (warning) => context.warnings.push(warning);
  context.typesMap = { connectionMetas: { MongoDBCollection: { tenant: true } } };
  const built = { auth: { organizations: { policy: 'tenant' } }, ...components };
  buildConnections({ components: built, context });
  buildCollections({ components: built, context });
  collectionsRules.forEach((rule) => rule.run({ components: built, context }));
  return context;
}

// buildConnections renames ids in place, so every test gets a fresh copy.
function connections() {
  return [
    {
      id: 'answers_rw',
      '~k': 'k_answers_rw',
      type: 'MongoDBCollection',
      properties: { databaseUri: 'x', collection: 'answers' },
    },
    {
      id: 'legacy',
      '~k': 'k_legacy',
      type: 'MongoDBCollection',
      properties: { databaseUri: 'x', collection: 'legacy_things' },
    },
    {
      id: 'dynamic',
      '~k': 'k_dynamic',
      type: 'MongoDBCollection',
      properties: { databaseUri: 'x', collection: { _secret: 'COLL' } },
    },
  ];
}

test('each collections rule is check-only under its own slug', () => {
  expect(collectionsRules.map((rule) => rule.slug)).toEqual([
    'collections-undeclared',
    'collections-dynamic',
    'collections-untenanted',
    'collections-field-migration',
    'collections-index',
  ]);
  collectionsRules.forEach((rule) => {
    expect(rule.checkOnly).toBe(true);
  });
});

test('collections rules are silent when the app declares no collections', () => {
  const context = check({ connections: connections() });
  expect(context.warnings).toEqual([]);
});

test('collections rules warn on undeclared, dynamic and untenanted connections', () => {
  const context = check({
    connections: connections(),
    collections: { answers: { tenant: 'organization_id' } },
  });
  expect(context.errors).toEqual([]);
  expect(context.warnings.map((w) => [w.configKey, w.checkSlug, w.message])).toEqual([
    [
      'k_legacy',
      'collections-undeclared',
      'Connection "legacy" addresses collection "legacy_things", which the app does not declare under collections:. Declare it so its tenancy, fields and relations are checked and appear in the data model.',
    ],
    [
      'k_dynamic',
      'collections-dynamic',
      'Connection "dynamic" names its collection with an operator, so it can not be joined to the collections: declaration. It opts out of the tenancy agreement check, the tenant $lookup check and the data model until the collection is a literal string.',
    ],
    [
      'k_answers_rw',
      'collections-untenanted',
      'Connection "answers_rw" declares no tenant but addresses collection "answers", which is declared tenant-scoped on "organization_id". If the connection is meant to be walled on that field declare tenant: organization_id; if it is a deliberate admin path, leave it and this note stands as the record.',
    ],
  ]);
});

test('untenanted rule does not fire for a shared collection or a tenanted connection', () => {
  const context = check({
    connections: [
      {
        id: 'a',
        type: 'MongoDBCollection',
        tenant: 'organization_id',
        properties: { databaseUri: 'x', collection: 'answers' },
      },
      {
        id: 'c',
        type: 'MongoDBCollection',
        properties: { databaseUri: 'x', collection: 'controls' },
      },
    ],
    collections: { answers: { tenant: 'organization_id' }, controls: { tenant: 'shared' } },
  });
  expect(context.warnings).toEqual([]);
});
