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

import resolveCollectionSchema from './resolveCollectionSchema.js';

const collections = {
  answers: {
    tenant: { field: 'organization_id' },
    fields: {
      test_id: { type: 'string' },
      result: { enum: ['pass', 'fail', 'partial', 'na'] },
    },
    relations: {},
    indexes: [],
    connections: [],
  },
  controls: { tenant: 'shared', relations: {}, indexes: [], connections: [] },
  empty: { fields: {}, relations: {}, indexes: [], connections: [] },
};

function createContext(artifact = collections) {
  return {
    readConfigFile: jest.fn(async (path) => (path === 'collections.json' ? artifact : null)),
  };
}

test('resolveCollectionSchema returns the name and fields of a collection that declares fields', async () => {
  const context = createContext();
  const res = await resolveCollectionSchema(context, { collectionName: 'answers' });
  expect(res).toEqual({ name: 'answers', fields: collections.answers.fields, required: [] });
  expect(res.fields).toBe(collections.answers.fields);
  expect(context.readConfigFile).toHaveBeenCalledWith('collections.json');
});

test('resolveCollectionSchema returns null for an undeclared collection', async () => {
  expect(await resolveCollectionSchema(createContext(), { collectionName: 'unknown' })).toBe(null);
});

test('resolveCollectionSchema returns null for a collection that declares no fields or empty fields', async () => {
  expect(await resolveCollectionSchema(createContext(), { collectionName: 'controls' })).toBe(null);
  expect(await resolveCollectionSchema(createContext(), { collectionName: 'empty' })).toBe(null);
});

test('resolveCollectionSchema returns null when the app declares no collections', async () => {
  expect(await resolveCollectionSchema(createContext({}), { collectionName: 'answers' })).toBe(
    null
  );
  expect(await resolveCollectionSchema(createContext(null), { collectionName: 'answers' })).toBe(
    null
  );
});

test('resolveCollectionSchema returns null without reading the artifact when the connection names no collection', async () => {
  const context = createContext();
  expect(await resolveCollectionSchema(context, { collectionName: undefined })).toBe(null);
  expect(await resolveCollectionSchema(context, { collectionName: '' })).toBe(null);
  expect(await resolveCollectionSchema(context, { collectionName: { _secret: 'C' } })).toBe(null);
  expect(context.readConfigFile).not.toHaveBeenCalled();
});
