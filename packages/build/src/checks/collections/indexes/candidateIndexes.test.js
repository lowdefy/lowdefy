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

import candidateIndexes from './candidateIndexes.js';
import buildCollections from '../../../build/buildCollections.js';
import buildConnections from '../../../build/buildConnections.js';
import testContext from '../../../test-utils/testContext.js';

function check(components, { policy } = {}) {
  const context = testContext({ logger: { debug: jest.fn() } });
  context.errors = [];
  context.warnings = [];
  context.handleWarning = (warning) => context.warnings.push(warning);
  context.typesMap = { connectionMetas: { MongoDBCollection: { tenant: true } } };
  const built = { auth: { organizations: { policy: policy ?? 'none' } }, ...components };
  buildConnections({ components: built, context });
  buildCollections({ components: built, context });
  candidateIndexes.run({ components: built, context });
  return context;
}

function connections() {
  return [
    {
      id: 'answers',
      type: 'MongoDBCollection',
      properties: { databaseUri: 'x', collection: 'answers' },
    },
    {
      id: 'controls',
      type: 'MongoDBCollection',
      properties: { databaseUri: 'x', collection: 'controls' },
    },
  ];
}

function page({ properties, type = 'MongoDBFind', connectionId = 'answers' }) {
  return {
    pages: [
      {
        pageId: 'list',
        requests: [{ requestId: 'get_answers', connectionId, type, properties, '~k': 'k_request' }],
      },
    ],
  };
}

const messages = (context) => context.warnings.map((warning) => warning.message);

test('candidateIndexes is a check-only rule under the collections-index slug', () => {
  expect(candidateIndexes.slug).toBe('collections-index');
  expect(candidateIndexes.checkOnly).toBe(true);
});

test('candidateIndexes is silent when the app declares no collections', () => {
  const context = check({
    connections: connections(),
    ...page({ properties: { query: { status: 'open' }, options: { sort: { created_at: -1 } } } }),
  });
  expect(context.warnings).toEqual([]);
});

test('candidateIndexes warns for a find whose equality and sort no declared index covers', () => {
  const context = check({
    connections: connections(),
    collections: { answers: {} },
    ...page({ properties: { query: { status: 'open' }, options: { sort: { created_at: -1 } } } }),
  });
  expect(context.warnings.map((warning) => [warning.configKey, warning.checkSlug])).toEqual([
    ['k_request', 'collections-index'],
  ]);
  expect(messages(context)[0]).toEqual(
    'Collection "answers" is queried with equality on status with a sort on created_at by request "get_answers" on page "list", and no declared index covers it. Declare it under collections.answers.indexes as { keys: { status: 1, created_at: -1 } } and create it with a MongoDBCreateIndexes step in a migration. Nothing is dropped for you — an index is removed by hand, and only when no query needs it.'
  );
});

test('candidateIndexes is silent when a declared index covers the query exactly', () => {
  const context = check({
    connections: connections(),
    collections: { answers: { indexes: [{ keys: { status: 1, created_at: -1 } }] } },
    ...page({ properties: { query: { status: 'open' }, options: { sort: { created_at: -1 } } } }),
  });
  expect(context.warnings).toEqual([]);
});

test('candidateIndexes counts a longer declared index as covering by prefix', () => {
  const context = check({
    connections: connections(),
    collections: {
      answers: { indexes: [{ keys: { status: 1, created_at: -1, reviewer: 1 } }] },
    },
    ...page({ properties: { query: { status: 'open' }, options: { sort: { created_at: -1 } } } }),
  });
  expect(context.warnings).toEqual([]);
});

test('candidateIndexes counts equality keys declared in another order as covered', () => {
  const context = check({
    connections: connections(),
    collections: { answers: { indexes: [{ keys: { status: 1, assignee: 1 } }] } },
    ...page({ properties: { query: { assignee: 'a', status: 'open' } } }),
  });
  expect(context.warnings).toEqual([]);
});

test('candidateIndexes does not count an index whose sort follows in the wrong order', () => {
  const context = check({
    connections: connections(),
    collections: { answers: { indexes: [{ keys: { created_at: -1, status: 1 } }] } },
    ...page({ properties: { query: { status: 'open' }, options: { sort: { created_at: -1 } } } }),
  });
  expect(messages(context)).toHaveLength(1);
});

test('candidateIndexes orders a suggestion equality, sort, then range', () => {
  const context = check({
    connections: connections(),
    collections: { answers: {} },
    ...page({
      properties: {
        query: { status: 'open', created_at: { $gt: '2026-01-01' } },
        options: { sort: { updated_at: -1 } },
      },
    }),
  });
  expect(messages(context)[0]).toContain('{ keys: { status: 1, updated_at: -1, created_at: 1 } }');
});

test('candidateIndexes ignores _id, which always has an index', () => {
  const context = check({
    connections: connections(),
    collections: { answers: {} },
    ...page({ properties: { query: { _id: 'a' } }, type: 'MongoDBFindOne' }),
  });
  expect(context.warnings).toEqual([]);
});

test('candidateIndexes reads $or branches and reports one suggestion per key set', () => {
  const context = check({
    connections: connections(),
    collections: { answers: {} },
    ...page({ properties: { query: { $or: [{ status: 'open' }, { assignee: 'a' }] } } }),
  });
  expect(messages(context)[0]).toContain('{ keys: { assignee: 1, status: 1 } }');
});

test('candidateIndexes reads the leading $match and $sort of a pipeline and stops at $group', () => {
  const context = check({
    connections: connections(),
    collections: { answers: {} },
    ...page({
      type: 'MongoDBAggregation',
      properties: {
        pipeline: [
          { $match: { status: 'open' } },
          { $sort: { created_at: -1 } },
          { $group: { _id: '$reviewer' } },
          { $match: { total: { $gt: 5 } } },
        ],
      },
    }),
  });
  expect(messages(context)).toHaveLength(1);
  expect(messages(context)[0]).toContain('{ keys: { status: 1, created_at: -1 } }');
});

test('candidateIndexes suggests an index on the $lookup foreignField collection', () => {
  const context = check({
    connections: connections(),
    collections: { answers: {}, controls: {} },
    ...page({
      type: 'MongoDBAggregation',
      properties: {
        pipeline: [{ $lookup: { from: 'controls', localField: 'control', foreignField: 'owner' } }],
      },
    }),
  });
  expect(messages(context)).toEqual([
    expect.stringContaining(
      'Collection "controls" is queried with equality on owner by request "get_answers" on page "list"'
    ),
  ]);
});

test('candidateIndexes reports two sites asking for one index as a single warning', () => {
  const properties = { query: { status: 'open', assignee: 'a' } };
  const context = check({
    connections: connections(),
    collections: { answers: {} },
    pages: [
      {
        pageId: 'list',
        requests: [
          { requestId: 'a', connectionId: 'answers', type: 'MongoDBFind', properties, '~k': 'k_a' },
          { requestId: 'b', connectionId: 'answers', type: 'MongoDBFind', properties, '~k': 'k_b' },
        ],
      },
    ],
  });
  expect(messages(context)).toHaveLength(1);
  expect(messages(context)[0]).toContain('by request "a" on page "list" (and 1 more site(s))');
});

test('candidateIndexes reads request steps in an endpoint routine', () => {
  const context = check({
    connections: connections(),
    collections: { answers: {} },
    api: [
      {
        endpointId: 'sync',
        routine: [
          {
            ':for': {
              ':do': [
                {
                  stepId: 'find',
                  connectionId: 'answers',
                  type: 'MongoDBFind',
                  properties: { query: { status: 'open', assignee: 'a' } },
                  '~k': 'k_step',
                },
              ],
            },
          },
        ],
      },
    ],
  });
  expect(messages(context)[0]).toContain('by step "find" on endpoint "sync"');
});

test('candidateIndexes adds the tenant field the wall injects at runtime', () => {
  const context = check(
    {
      connections: [
        {
          id: 'answers',
          type: 'MongoDBCollection',
          tenant: 'organization_id',
          properties: { databaseUri: 'x', collection: 'answers' },
        },
      ],
      collections: { answers: { tenant: 'organization_id' } },
      ...page({ properties: { query: { status: 'open' } } }),
    },
    { policy: 'tenant' }
  );
  expect(messages(context)[0]).toContain('{ keys: { organization_id: 1, status: 1 } }');
});

test('candidateIndexes reports a single key-shaped lookup at debug, not as a warning', () => {
  const context = check({
    connections: connections(),
    collections: { answers: {} },
    ...page({ properties: { query: { external_id: 'x' } }, type: 'MongoDBFindOne' }),
  });
  expect(context.warnings).toEqual([]);
  expect(context.logger.debug).toHaveBeenCalledWith(
    'Collection "answers" is looked up by "external_id" at request "get_answers" on page "list", which no declared index covers. If that field is a key, declare { keys: { external_id: 1 }, options: { unique: true } }.'
  );
});

test('candidateIndexes reports a declared index no query uses at debug, not as a warning', () => {
  const context = check({
    connections: connections(),
    collections: { answers: { indexes: [{ keys: { legacy_ref: 1 } }] } },
    ...page({ properties: { query: { status: 'open' } } }),
  });
  expect(messages(context)).toHaveLength(1);
  expect(context.logger.debug).toHaveBeenCalledWith(
    'Collection "answers" declares index {"legacy_ref":1}, which no query in this app uses. It may serve a consumer outside the app, so it is not a warning and is never dropped for you.'
  );
});

test('candidateIndexes says nothing about a collection the app does not declare', () => {
  const context = check({
    connections: [
      {
        id: 'legacy',
        type: 'MongoDBCollection',
        properties: { databaseUri: 'x', collection: 'legacy_things' },
      },
    ],
    collections: { answers: {} },
    ...page({ properties: { query: { status: 'open' } }, connectionId: 'legacy' }),
  });
  expect(context.warnings).toEqual([]);
});
