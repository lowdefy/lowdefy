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

import { serializer } from '@lowdefy/helpers';

import writeMigrations from './writeMigrations.js';

function testContext() {
  const artifacts = {};
  return {
    artifacts,
    writeBuildArtifact: async (filePath, content) => {
      artifacts[filePath] = content;
    },
  };
}

test('writeMigrations writes an empty index carrying the stage when there are no migrations', async () => {
  const context = testContext();
  context.migrations = [];
  context.migrationsStage = 'prod';
  await writeMigrations({ context });
  expect(serializer.deserializeFromString(context.artifacts['migrations.json'])).toEqual({
    stage: 'prod',
    migrations: [],
  });
});

test('writeMigrations writes a null stage and empty list when nothing was built', async () => {
  const context = testContext();
  await writeMigrations({ context });
  expect(serializer.deserializeFromString(context.artifacts['migrations.json'])).toEqual({
    stage: null,
    migrations: [],
  });
});

test('writeMigrations writes one artifact per migration plus the ordered index', async () => {
  const context = testContext();
  const migrations = [
    {
      id: '2026-08-30-01-a',
      checksum: 'aaaa1111bbbb2222',
      name: 'first',
      applied: true,
      ledgerChecksum: 'aaaa1111bbbb2222',
      routine: [
        { id: 'request:migration:2026-08-30-01-a:s', stepId: 's', type: 'MongoDBUpdateMany' },
      ],
    },
    {
      id: '2026-08-30-02-b',
      checksum: 'cccc3333dddd4444',
      applied: false,
      routine: [
        { id: 'request:migration:2026-08-30-02-b:s', stepId: 's', type: 'MongoDBUpdateMany' },
      ],
    },
  ];
  context.migrations = migrations;
  context.migrationsStage = 'dev';
  await writeMigrations({ context });

  const index = serializer.deserializeFromString(context.artifacts['migrations.json']);
  expect(index).toEqual({
    stage: 'dev',
    migrations: [
      {
        id: '2026-08-30-01-a',
        checksum: 'aaaa1111bbbb2222',
        applied: true,
        ledgerChecksum: 'aaaa1111bbbb2222',
      },
      { id: '2026-08-30-02-b', checksum: 'cccc3333dddd4444', applied: false },
    ],
  });

  const artifactA = serializer.deserializeFromString(
    context.artifacts['migrations/2026-08-30-01-a.json']
  );
  expect(artifactA.id).toBe('2026-08-30-01-a');
  expect(artifactA.checksum).toBe('aaaa1111bbbb2222');
  expect(artifactA.name).toBe('first');
  expect(artifactA.routine[0].stepId).toBe('s');
});
