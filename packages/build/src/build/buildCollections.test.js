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
import { compile } from '@lowdefy/ajv';

import buildCollections from './buildCollections.js';
import buildConnections from './buildConnections.js';
import testContext from '../test-utils/testContext.js';

function createContext() {
  const context = testContext();
  context.errors = [];
  context.warnings = [];
  context.typesMap = { connectionMetas: { MongoDBCollection: { tenant: true } } };
  return context;
}

function run(components, { connections } = {}) {
  const context = createContext();
  const built = {
    auth: { organizations: { policy: 'tenant' } },
    connections: connections ?? [],
    ...components,
  };
  buildConnections({ components: built, context });
  buildCollections({ components: built, context });
  return context;
}

test('buildCollections stores an empty map when the app declares no collections', () => {
  const context = run({});
  expect(context.collections).toEqual({});
  expect(context.errors).toEqual([]);
});

test('buildCollections normalises a string tenant to { field } and keeps shared', () => {
  const context = run({
    collections: {
      answers: { tenant: 'organization_id' },
      controls: { tenant: 'shared' },
    },
  });
  expect(context.collections.answers.tenant).toEqual({ field: 'organization_id' });
  expect(context.collections.controls.tenant).toBe('shared');
  expect(context.errors).toEqual([]);
});

test('buildCollections normalises the three fields forms to JSON Schema fragments', () => {
  const context = run({
    collections: {
      answers: {
        fields: {
          test_id: 'string',
          created_at: 'date',
          evidence_ids: ['string'],
          result: { enum: ['pass', 'fail'] },
          tags: { type: 'array', items: { type: 'string', enum: ['a'] } },
        },
      },
    },
  });
  expect(context.errors).toEqual([]);
  expect(context.collections.answers.fields).toEqual({
    test_id: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
    evidence_ids: { type: 'array', items: { type: 'string' } },
    result: { enum: ['pass', 'fail'] },
    tags: { type: 'array', items: { type: 'string', enum: ['a'] } },
  });
});

test('buildCollections errors on an unknown type name listing the accepted names', () => {
  const context = run({
    collections: { answers: { '~k': 'k_answers', fields: { owner: 'objectId' } } },
  });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    'Collection "answers" field "owner" is not a valid declaration: Unknown type "objectId". Accepted types: string, number, integer, boolean, date, object, array, null.'
  );
  expect(context.errors[0]).toMatchObject({ configKey: 'k_answers', checkSlug: 'collections' });
});

test('buildCollections errors on an unknown collection key listing the valid ones', () => {
  const context = run({
    collections: { answers: { '~k': 'k_answers', schema: {} } },
  });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    'Collection "answers" has unknown key(s) "schema". Valid keys: tenant, fields, relations, indexes, required.'
  );
  expect(context.errors[0].checkSlug).toBe('collections');
});

test('buildCollections errors on a bad tenant value', () => {
  const context = run({ collections: { answers: { '~k': 'k_answers', tenant: true } } });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    'Collection "answers" tenant must be "shared" or a tenant field name. Received true.'
  );
  expect(context.errors[0]).toMatchObject({ configKey: 'k_answers', checkSlug: 'collections' });
});

test('buildCollections errors on a relation whose target field is not declared', () => {
  const context = run({
    collections: {
      answers: { relations: { '~k': 'k_rel', test_id: 'tests.id' } },
      tests: { fields: { _id: 'string', title: 'string' } },
    },
  });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    'Collection "answers" relation "test_id" targets "tests.id", which "tests" does not declare. Fields: _id, title.'
  );
  expect(context.errors[0]).toMatchObject({ configKey: 'k_rel', checkSlug: 'collections' });
});

test('buildCollections errors on a relation to an undeclared collection', () => {
  const context = run({
    collections: { answers: { relations: { test_id: 'tests._id' } } },
  });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    'Collection "answers" relation "test_id" targets "tests._id", but collection "tests" is not declared. Declared collections: answers.'
  );
});

test('buildCollections accepts a relation into a collection that declares no fields', () => {
  const context = run({
    collections: {
      answers: { relations: { test_id: 'tests._id' } },
      tests: { tenant: 'shared' },
    },
  });
  expect(context.errors).toEqual([]);
  expect(context.collections.answers.relations.test_id).toMatchObject({
    collection: 'tests',
    field: '_id',
  });
});

test('buildCollections validates and passes indexes through', () => {
  const context = run({
    collections: {
      answers: {
        indexes: [{ keys: { organization_id: 1, test_id: 1 }, options: { unique: true } }],
      },
      bad: { '~k': 'k_bad', indexes: [{ options: {} }] },
    },
  });
  expect(context.collections.answers.indexes).toEqual([
    { keys: { organization_id: 1, test_id: 1 }, options: { unique: true } },
  ]);
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toMatch(
    /^Collection "bad" index must be an object with a "keys" object/
  );
});

test('buildCollections joins connections by literal collection with read and write', () => {
  const context = run(
    { collections: { answers: { tenant: 'organization_id' }, controls: { tenant: 'shared' } } },
    {
      connections: [
        {
          id: 'answers_rw',
          type: 'MongoDBCollection',
          properties: { databaseUri: 'x', collection: 'answers', write: true },
        },
        {
          id: 'answers_ro',
          type: 'MongoDBCollection',
          tenant: { field: 'organization_id' },
          properties: { databaseUri: 'x', collection: 'answers', write: false },
        },
        {
          id: 'controls',
          type: 'MongoDBCollection',
          tenant: 'shared',
          properties: { databaseUri: 'x', collection: 'controls', read: true },
        },
        {
          id: 'dynamic',
          type: 'MongoDBCollection',
          properties: { databaseUri: 'x', collection: { _secret: 'COLL' } },
        },
      ],
    }
  );
  expect(context.errors).toEqual([]);
  expect(context.collections.answers.connections).toEqual([
    { connectionId: 'answers_rw', read: true, write: true, tenant: undefined },
    {
      connectionId: 'answers_ro',
      read: true,
      write: false,
      tenant: { field: 'organization_id' },
    },
  ]);
  expect(context.collections.controls.connections).toEqual([
    { connectionId: 'controls', read: true, write: false, tenant: 'shared' },
  ]);
  expect(context.connectionCollections.find((b) => b.connectionId === 'dynamic')).toMatchObject({
    collection: undefined,
    dynamicCollection: true,
  });
});

test('buildCollections errors when a scoped connection addresses a shared collection', () => {
  const context = run(
    { collections: { controls: { tenant: 'shared' } } },
    {
      connections: [
        {
          id: 'org-scope',
          '~k': 'k_conn',
          type: 'MongoDBCollection',
          tenant: { field: 'organization_id' },
          properties: { databaseUri: 'x', collection: 'controls' },
        },
      ],
    }
  );
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    'Connection "org-scope" is tenant-scoped on "organization_id" but collection "controls" is declared shared. One of the two is wrong — a scoped read of a shared collection matches nothing.'
  );
  expect(context.errors[0]).toMatchObject({ configKey: 'k_conn', checkSlug: 'collections' });
});

test('buildCollections errors when the tenant fields disagree', () => {
  const context = run(
    { collections: { answers: { tenant: 'organization_id' } } },
    {
      connections: [
        {
          id: 'a',
          type: 'MongoDBCollection',
          tenant: { field: 'tenant_id' },
          properties: { databaseUri: 'x', collection: 'answers' },
        },
      ],
    }
  );
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    'Connection "a" is tenant-scoped on "tenant_id" but collection "answers" is tenant-scoped on "organization_id". One of the two is wrong — a scoped read of a shared collection matches nothing.'
  );
});

test('buildCollections does not error when the connection declares no tenant', () => {
  const context = run(
    { collections: { answers: { tenant: 'organization_id' } } },
    {
      connections: [
        {
          id: 'admin',
          type: 'MongoDBCollection',
          properties: { databaseUri: 'x', collection: 'answers' },
        },
      ],
    }
  );
  expect(context.errors).toEqual([]);
  expect(context.collections.answers.connections).toHaveLength(1);
});

test('buildCollections keeps collecting after one bad collection', () => {
  const context = run({
    collections: { bad: 'nope', good: { tenant: 'shared' } },
  });
  expect(context.errors).toHaveLength(1);
  expect(context.collections.good.tenant).toBe('shared');
  expect(jest.isMockFunction(context.writeBuildArtifact)).toBe(false);
});

test('buildCollections accepts the collection-level required array', () => {
  const context = run({
    collections: {
      answers: {
        fields: { test_id: 'string', result: { enum: ['pass', 'fail'] } },
        required: ['test_id', 'result'],
      },
    },
  });
  expect(context.errors).toEqual([]);
  expect(context.collections.answers.required).toEqual(['test_id', 'result']);
  expect(context.collections.answers.fields.test_id).toEqual({ type: 'string' });
});

test('buildCollections folds a per-field required: true into the array and warns', () => {
  const context = createContext();
  const built = {
    auth: { organizations: { policy: 'tenant' } },
    connections: [],
    collections: {
      answers: { '~k': 'k_answers', fields: { test_id: { type: 'string', required: true } } },
    },
  };
  buildCollections({ components: built, context });
  expect(context.errors).toEqual([]);
  expect(context.collections.answers.required).toEqual(['test_id']);
  expect(context.collections.answers.fields.test_id).toEqual({ type: 'string' });
  expect(context.warnings).toHaveLength(1);
  expect(context.warnings[0].message).toBe(
    'Collection "answers" field "test_id" declares "required: true". Declare it as the collection-level array instead: required: [test_id].'
  );
});

test('buildCollections errors when the collection-level required is not an array of names', () => {
  const context = run({
    collections: { answers: { '~k': 'k_answers', fields: { a: 'string' }, required: 'a' } },
  });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toBe(
    'Collection "answers" required must be an array of field names. Received "a".'
  );
});

test('buildCollections accepts a nested properties declaration', () => {
  const context = run({
    collections: {
      answers: {
        fields: {
          address: {
            type: 'object',
            properties: { city: 'string', postcode: { type: 'string', required: true } },
          },
        },
      },
    },
  });
  expect(context.errors).toEqual([]);
  expect(context.collections.answers.fields.address).toEqual({
    type: 'object',
    properties: { city: { type: 'string' }, postcode: { type: 'string' } },
    required: ['postcode'],
  });
});

test('buildCollections writes fields every consumer can compile with ajv untouched', () => {
  const context = run({
    collections: {
      answers: {
        fields: {
          created_at: 'date',
          address: { type: 'object', properties: { city: 'string' } },
          tags: ['string'],
        },
        required: ['created_at'],
      },
    },
  });
  expect(context.errors).toEqual([]);
  const { fields, required } = context.collections.answers;
  const validator = compile({ schema: { type: 'object', properties: fields, required } });
  expect(
    validator({
      created_at: new Date(0).toISOString(),
      address: { city: 'Cape Town' },
      tags: ['a'],
    }).valid
  ).toBe(true);
  expect(validator({ address: { city: 'Cape Town' } }).valid).toBe(false);
});

test('buildCollections collects pii field names onto the collection and keeps pii out of the schema fragment', () => {
  const context = createContext();
  const components = {
    collections: {
      users: {
        fields: {
          email: { type: 'string', pii: true },
          name: { type: 'string', pii: false },
          age: 'number',
        },
      },
    },
  };
  buildCollections({ components, context });
  expect(context.collections.users.pii).toEqual(['email']);
  expect(context.collections.users.fields.email).toEqual({ type: 'string' });
});

test('buildCollections throws when pii is not a boolean', () => {
  const context = createContext();
  const components = {
    collections: { users: { fields: { email: { type: 'string', pii: 'yes' } } } },
  };
  buildCollections({ components, context });
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0].message).toContain('pii must be a boolean');
});
