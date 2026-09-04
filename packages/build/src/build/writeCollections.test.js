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

import writeCollections from './writeCollections.js';
import testContext from '../test-utils/testContext.js';

test('writeCollections writes collections.json as {} when nothing is declared', async () => {
  const writeBuildArtifact = jest.fn();
  const context = testContext({ writeBuildArtifact });
  context.collections = {};
  await writeCollections({ components: {}, context });
  expect(writeBuildArtifact.mock.calls).toEqual([['collections.json', '{}']]);
});

test('writeCollections writes the stable artifact shape without build bookkeeping', async () => {
  const writeBuildArtifact = jest.fn();
  const context = testContext({ writeBuildArtifact });
  context.collections = {
    answers: {
      tenant: { field: 'organization_id' },
      fields: { test_id: { type: 'string' } },
      required: ['test_id'],
      relations: { test_id: { collection: 'tests', field: '_id', configKey: 'k1' } },
      indexes: [{ keys: { organization_id: 1, test_id: 1 }, options: { unique: true } }],
      connections: [
        {
          connectionId: 'answers_rw',
          read: true,
          write: true,
          tenant: { field: 'organization_id' },
        },
      ],
      configKey: 'k0',
    },
    tests: { fields: undefined, relations: {}, indexes: [], connections: [], configKey: 'k2' },
  };
  await writeCollections({ components: {}, context });
  expect(writeBuildArtifact).toHaveBeenCalledTimes(1);
  expect(JSON.parse(writeBuildArtifact.mock.calls[0][1])).toEqual({
    answers: {
      tenant: { field: 'organization_id' },
      fields: { test_id: { type: 'string' } },
      required: ['test_id'],
      relations: { test_id: { collection: 'tests', field: '_id' } },
      indexes: [{ keys: { organization_id: 1, test_id: 1 }, options: { unique: true } }],
      connections: [
        {
          connectionId: 'answers_rw',
          read: true,
          write: true,
          tenant: { field: 'organization_id' },
        },
      ],
    },
    tests: { relations: {}, indexes: [], connections: [] },
  });
});

test('writeCollections writes a required field in a form every consumer can compile', async () => {
  const writeBuildArtifact = jest.fn();
  const context = testContext({ writeBuildArtifact });
  context.collections = {
    answers: {
      fields: { test_id: { type: 'string' }, created_at: { type: 'string', format: 'date-time' } },
      required: ['test_id'],
      relations: {},
      indexes: [],
      connections: [],
    },
  };
  await writeCollections({ components: {}, context });
  const artifact = JSON.parse(writeBuildArtifact.mock.calls[0][1]);
  const { fields, required } = artifact.answers;
  const validator = compile({ schema: { type: 'object', properties: fields, required } });
  expect(validator({ test_id: 'a', created_at: new Date(0).toISOString() }).valid).toBe(true);
  expect(validator({ created_at: new Date(0).toISOString() }).valid).toBe(false);
});
