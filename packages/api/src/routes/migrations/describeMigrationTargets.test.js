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
import describeMigrationTargets, {
  collectConnectionIds,
  databaseNameOf,
} from './describeMigrationTargets.js';

test('collectConnectionIds walks controls and nested branches', () => {
  const routine = [
    { id: 'request:m:a', stepId: 'a', type: 'MongoDBFind', connectionId: 'things' },
    {
      ':for': {
        list: { _step: 'a' },
        ':do': [
          { id: 'request:m:b', stepId: 'b', type: 'MongoDBUpdateOne', connectionId: 'things' },
          {
            ':if': true,
            ':then': [
              {
                id: 'request:m:c',
                stepId: 'c',
                type: 'MongoDBUpdateMany',
                connectionId: 'evidence',
              },
            ],
          },
        ],
      },
    },
  ];
  expect([...collectConnectionIds(routine)].sort()).toEqual(['evidence', 'things']);
});

test('databaseNameOf reads the database from a MongoDB URI and null otherwise', () => {
  expect(databaseNameOf({ databaseUri: 'mongodb://localhost:27017/app?retryWrites=true' })).toBe(
    'app'
  );
  expect(databaseNameOf({ databaseUri: 'mongodb+srv://u:p@cluster.example.com/prod' })).toBe(
    'prod'
  );
  expect(databaseNameOf({ databaseUri: 'mongodb://localhost:27017' })).toBeNull();
  expect(databaseNameOf({ databaseUri: { _secret: 'MONGODB_URI' } })).toBeNull();
  expect(databaseNameOf({})).toBeNull();
});

test('describeMigrationTargets resolves each distinct connection once, in order, and reports failures', async () => {
  const artifacts = {
    'migrations/m1.json': {
      routine: [{ type: 'MongoDBFind', connectionId: 'things' }],
    },
    'migrations/m2.json': {
      routine: [
        { type: 'MongoDBUpdateMany', connectionId: 'things' },
        { type: 'MongoDBUpdateMany', connectionId: 'broken' },
      ],
    },
    'connections/things.json': {
      type: 'MongoDBCollection',
      properties: { databaseUri: { _secret: 'URI' } },
    },
  };
  const context = {
    logger: { debug: () => {} },
    readConfigFile: async (name) => artifacts[name] ?? null,
    evaluateOperators: ({ input }) => ({ ...input, databaseUri: 'mongodb://db.example/app' }),
  };
  const targets = await describeMigrationTargets(context, {
    pending: [{ id: 'm1' }, { id: 'm2' }],
  });
  expect(targets).toEqual([
    {
      connectionId: 'broken',
      type: null,
      database: null,
      error: 'Connection "broken" does not exist.',
    },
    { connectionId: 'things', type: 'MongoDBCollection', database: 'app' },
  ]);
});
