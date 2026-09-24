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

async function getFactoryArgs({ db = { collection: jest.fn() } } = {}) {
  const { default: mongodbAdapter } = await import('./mongodbAdapter.js');
  mongodbAdapter({ db });
  return mockCreateAdapterFactory.mock.calls[0][0];
}

async function getFactoryConfig() {
  const { config } = await getFactoryArgs();
  return config;
}

// Constructs the adapter the way BetterAuth's factory does, so the fieldName
// derive runs over the given schema. getFieldName mirrors the factory's own
// resolution (schema[model].fields[field].fieldName || field) so the where path
// exercises the derived physical names rather than a pass-through stub.
async function constructCustomAdapter({ schema, collection = {} }) {
  const { adapter } = await getFactoryArgs({ db: { collection: jest.fn(() => collection) } });
  return adapter({
    getFieldAttributes: ({ model, field }) => schema[model]?.fields[field] ?? {},
    getFieldName: ({ model, field }) => schema[model]?.fields[field]?.fieldName || field,
    schema,
    getDefaultModelName: (model) => model,
    options: {},
  });
}

// The schema BetterAuth resolves for a Lowdefy app: core models, plugin models,
// and additionalFields.
async function resolveAuthSchema() {
  const { getAuthTables } = await import('better-auth/db');
  const { organization, twoFactor } = await import('better-auth/plugins');
  return getAuthTables({
    plugins: [organization(), twoFactor()],
    user: {
      additionalFields: {
        appRoles: { type: 'string' },
        attributes: { type: 'json' },
      },
    },
  });
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

test('adapter construction derives snake_case physical names over the resolved schema', async () => {
  const schema = await resolveAuthSchema();
  await constructCustomAdapter({ schema });
  expect(schema.user.fields.emailVerified.fieldName).toEqual('email_verified');
  expect(schema.user.fields.twoFactorEnabled.fieldName).toEqual('two_factor_enabled');
  expect(schema.user.fields.appRoles.fieldName).toEqual('app_roles');
  expect(schema.session.fields.userId.fieldName).toEqual('user_id');
  expect(schema.session.fields.activeOrganizationId.fieldName).toEqual('active_organization_id');
  expect(schema.session.fields.ipAddress.fieldName).toEqual('ip_address');
  expect(schema.account.fields.accessTokenExpiresAt.fieldName).toEqual('access_token_expires_at');
  expect(schema.member.fields.organizationId.fieldName).toEqual('organization_id');
  expect(schema.invitation.fields.inviterId.fieldName).toEqual('inviter_id');
  expect(schema.twoFactor.fields.backupCodes.fieldName).toEqual('backup_codes');
});

test('adapter construction leaves single-word field names unchanged', async () => {
  const schema = await resolveAuthSchema();
  await constructCustomAdapter({ schema });
  expect(schema.session.fields.token.fieldName).toEqual('token');
  expect(schema.user.fields.email.fieldName).toEqual('email');
  expect(schema.user.fields.attributes.fieldName).toEqual('attributes');
  expect(schema.organization.fields.slug.fieldName).toEqual('slug');
  expect(schema.invitation.fields.status.fieldName).toEqual('status');
});

test('adapter construction derives a physical name for every field of every model', async () => {
  const schema = await resolveAuthSchema();
  await constructCustomAdapter({ schema });
  Object.values(schema).forEach((model) => {
    Object.values(model.fields).forEach((field) => {
      expect(typeof field.fieldName).toEqual('string');
      expect(field.fieldName).toEqual(field.fieldName.toLowerCase());
    });
  });
});

test('adapter construction skips the id field so it keeps mapping to _id', async () => {
  // The factory injects an id field into the schema before transforming input,
  // so the derive has to leave it alone.
  const schema = { user: { fields: { id: {}, userId: {} } } };
  await constructCustomAdapter({ schema });
  expect(schema.user.fields.id.fieldName).toBeUndefined();
  expect(schema.user.fields.userId.fieldName).toEqual('user_id');
});

test('adapter construction keeps trailing acronyms and digits attached', async () => {
  const schema = {
    passkey: {
      fields: {
        credentialID: {},
        publicKey: {},
        deviceType: {},
        aaguid: {},
        field1: {},
      },
    },
  };
  await constructCustomAdapter({ schema });
  expect(schema.passkey.fields.credentialID.fieldName).toEqual('credential_id');
  expect(schema.passkey.fields.publicKey.fieldName).toEqual('public_key');
  expect(schema.passkey.fields.deviceType.fieldName).toEqual('device_type');
  expect(schema.passkey.fields.aaguid.fieldName).toEqual('aaguid');
  expect(schema.passkey.fields.field1.fieldName).toEqual('field1');
});

test('a where clause on a logical field name resolves to the derived column', async () => {
  const schema = await resolveAuthSchema();
  const aggregate = jest.fn(() => ({ toArray: jest.fn().mockResolvedValue([]) }));
  const customAdapter = await constructCustomAdapter({ schema, collection: { aggregate } });
  await customAdapter.findOne({
    model: 'member',
    where: [{ field: 'organizationId', value: 'org-1' }],
    select: ['userId', 'role'],
  });
  expect(aggregate).toHaveBeenCalledWith([
    { $match: { organization_id: 'org-1' } },
    { $project: { user_id: 1, role: 1 } },
    { $limit: 1 },
  ]);
});
