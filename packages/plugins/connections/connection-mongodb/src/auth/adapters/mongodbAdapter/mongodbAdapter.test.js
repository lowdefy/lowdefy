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
import { ObjectId, UUID } from 'mongodb';

const mockCreateAdapterFactory = jest.fn(() => 'adapterFactory');

jest.unstable_mockModule('better-auth/adapters', () => ({
  createAdapterFactory: mockCreateAdapterFactory,
}));

async function getFactoryConfig() {
  const { default: mongodbAdapter } = await import('./mongodbAdapter.js');
  mongodbAdapter({ db: { collection: jest.fn() } });
  return mockCreateAdapterFactory.mock.calls[0][0].config;
}

beforeEach(() => {
  mockCreateAdapterFactory.mockClear();
});

test('mongodbAdapter enables native sub-document storage for json fields', async () => {
  const config = await getFactoryConfig();
  expect(config.supportsJSON).toBe(true);
  expect(config.supportsArrays).toBe(true);
  expect(config.supportsNumericIds).toBe(false);
  expect(config.transaction).toBe(false);
  expect(config.mapKeysTransformInput).toEqual({ id: '_id' });
  expect(config.mapKeysTransformOutput).toEqual({ _id: 'id' });
});

test('customTransformInput coerces string ids to ObjectId on create and update', async () => {
  const config = await getFactoryConfig();
  const hex = new ObjectId().toHexString();
  const result = config.customTransformInput({
    action: 'create',
    data: hex,
    field: '_id',
    fieldAttributes: {},
    options: {},
  });
  expect(result).toBeInstanceOf(ObjectId);
  expect(result.toHexString()).toEqual(hex);
});

test('customTransformInput generates a new id when creating without one', async () => {
  const config = await getFactoryConfig();
  const result = config.customTransformInput({
    action: 'create',
    data: undefined,
    field: '_id',
    fieldAttributes: {},
    options: {},
  });
  expect(result).toBeInstanceOf(ObjectId);
});

test('customTransformInput keeps invalid id strings as-is', async () => {
  const config = await getFactoryConfig();
  const result = config.customTransformInput({
    action: 'create',
    data: 'not-an-object-id',
    field: '_id',
    fieldAttributes: {},
    options: {},
  });
  expect(result).toEqual('not-an-object-id');
});

test('customTransformInput leaves non-id fields untouched', async () => {
  const config = await getFactoryConfig();
  const attributes = { region: 'emea' };
  const result = config.customTransformInput({
    action: 'create',
    data: attributes,
    field: 'attributes',
    fieldAttributes: { type: 'json' },
    options: {},
  });
  expect(result).toBe(attributes);
});

test('customTransformInput uses UUID ids when generateId is uuid', async () => {
  const config = await getFactoryConfig();
  const result = config.customTransformInput({
    action: 'create',
    data: undefined,
    field: '_id',
    fieldAttributes: {},
    options: { advanced: { database: { generateId: 'uuid' } } },
  });
  expect(result).toBeInstanceOf(UUID);
});

test('customTransformInput skips coercion with a custom generateId function', async () => {
  const config = await getFactoryConfig();
  const result = config.customTransformInput({
    action: 'create',
    data: 'custom-id',
    field: '_id',
    fieldAttributes: {},
    options: { advanced: { database: { generateId: () => 'custom-id' } } },
  });
  expect(result).toEqual('custom-id');
});

test('customTransformInput passes null through for optional id references', async () => {
  const config = await getFactoryConfig();
  const result = config.customTransformInput({
    action: 'create',
    data: null,
    field: 'activeOrganizationId',
    fieldAttributes: { references: { field: 'id' }, required: false },
    options: {},
  });
  expect(result).toBeNull();
});

test('customTransformOutput converts BSON ids back to strings', async () => {
  const config = await getFactoryConfig();
  const objectId = new ObjectId();
  expect(
    config.customTransformOutput({ data: objectId, field: 'id', fieldAttributes: {} })
  ).toEqual(objectId.toHexString());
  const uuid = new UUID();
  expect(config.customTransformOutput({ data: uuid, field: 'id', fieldAttributes: {} })).toEqual(
    uuid.toString()
  );
  expect(
    config.customTransformOutput({
      data: [objectId],
      field: 'userId',
      fieldAttributes: { references: { field: 'id' } },
    })
  ).toEqual([objectId.toHexString()]);
});

test('customTransformOutput returns native json sub-documents as-is', async () => {
  const config = await getFactoryConfig();
  const attributes = { region: 'emea', tier: 2 };
  const result = config.customTransformOutput({
    data: attributes,
    field: 'attributes',
    fieldAttributes: { type: 'json' },
  });
  expect(result).toBe(attributes);
});

test('customTransformOutput parses legacy JSON-string rows in json fields', async () => {
  const config = await getFactoryConfig();
  const result = config.customTransformOutput({
    data: '{"region":"emea","tier":2}',
    field: 'attributes',
    fieldAttributes: { type: 'json' },
  });
  expect(result).toEqual({ region: 'emea', tier: 2 });
});

test('customTransformOutput keeps unparseable strings in json fields as-is', async () => {
  const config = await getFactoryConfig();
  const result = config.customTransformOutput({
    data: 'not-json{',
    field: 'attributes',
    fieldAttributes: { type: 'json' },
  });
  expect(result).toEqual('not-json{');
});

test('customTransformOutput does not parse strings in non-json fields', async () => {
  const config = await getFactoryConfig();
  const result = config.customTransformOutput({
    data: '{"looks":"like-json"}',
    field: 'name',
    fieldAttributes: { type: 'string' },
  });
  expect(result).toEqual('{"looks":"like-json"}');
});

test('customIdGenerator returns ObjectId hex strings', async () => {
  const config = await getFactoryConfig();
  const id = config.customIdGenerator();
  expect(ObjectId.isValid(id)).toBe(true);
});
