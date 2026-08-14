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

import { MongoClient } from 'mongodb';

import MultiAppMongoDBAdapter from './MultiAppMongoDBAdapter.js';
import createDatabaseUser from './createDatabaseUser.js';
import getUserFromDbByEmail from './getUserFromDbByEmail.js';
import getUserFromDbById from './getUserFromDbById.js';
import transformContactToAdapterUser from './transformContactToAdapterUser.js';

const appName = 'test-app';
const collectionNames = {
  accounts: 'user-accounts',
  contacts: 'user-contacts',
  sessions: 'user-sessions',
  verificationTokens: 'user-verification-tokens',
};

let mongoClient;

beforeAll(async () => {
  mongoClient = new MongoClient(process.env.MONGO_URL);
  await mongoClient.connect();
});

beforeEach(async () => {
  await mongoClient.db().collection(collectionNames.contacts).deleteMany({});
});

afterAll(async () => {
  await mongoClient.close();
});

test('adapter factory returns the next-auth adapter methods', () => {
  const adapter = MultiAppMongoDBAdapter({
    properties: { appName, databaseUri: process.env.MONGO_URL },
  });
  expect(Object.keys(adapter).sort()).toEqual([
    'createSession',
    'createUser',
    'createVerificationToken',
    'deleteSession',
    'getSessionAndUser',
    'getUser',
    'getUserByAccount',
    'getUserByEmail',
    'linkAccount',
    'unlinkAccount',
    'updateSession',
    'updateUser',
    'useVerificationToken',
  ]);
});

test('createDatabaseUser creates a new contact when none exists', async () => {
  const user = await createDatabaseUser({
    adapterUserData: { email: 'New.User@Example.com', emailVerified: null, image: null },
    appName,
    collectionNames,
    inviteRequired: false,
    mongoClient,
  });
  expect(user).toEqual({
    id: expect.any(String),
    app_attributes: {},
    email: 'New.User@Example.com',
    emailVerified: null,
    image: null,
    profile: {},
    roles: [],
    global_attributes: {},
  });
  const contact = await mongoClient
    .db()
    .collection(collectionNames.contacts)
    .findOne({ lowercase_email: 'new.user@example.com' });
  expect(contact).toMatchObject({
    email: 'New.User@Example.com',
    lowercase_email: 'new.user@example.com',
    disabled: false,
    apps: {
      [appName]: {
        app_attributes: {},
        disabled: false,
        is_user: true,
        roles: [],
      },
    },
  });
});

test('createDatabaseUser throws Access denied when invite required and no contact exists', async () => {
  await expect(
    createDatabaseUser({
      adapterUserData: { email: 'uninvited@example.com', emailVerified: null },
      appName,
      collectionNames,
      inviteRequired: true,
      mongoClient,
    })
  ).rejects.toThrow('Access denied.');
});

test('createDatabaseUser consumes an open invite when invite required', async () => {
  await mongoClient
    .db()
    .collection(collectionNames.contacts)
    .insertOne({
      _id: 'invited-contact',
      email: 'invited@example.com',
      lowercase_email: 'invited@example.com',
      disabled: false,
      apps: {
        [appName]: {
          app_attributes: {},
          disabled: false,
          is_user: false,
          roles: ['admin'],
          invite: { open: true },
        },
      },
    });
  const user = await createDatabaseUser({
    adapterUserData: { email: 'invited@example.com', emailVerified: new Date(), image: null },
    appName,
    collectionNames,
    inviteRequired: true,
    mongoClient,
  });
  expect(user).toMatchObject({
    id: 'invited-contact',
    email: 'invited@example.com',
    roles: ['admin'],
  });
  const contact = await mongoClient
    .db()
    .collection(collectionNames.contacts)
    .findOne({ _id: 'invited-contact' });
  expect(contact.apps[appName].invite.open).toBe(false);
  expect(contact.apps[appName].is_user).toBe(true);
});

test('createDatabaseUser throws Access denied for a contact without an open invite', async () => {
  await mongoClient
    .db()
    .collection(collectionNames.contacts)
    .insertOne({
      _id: 'no-invite-contact',
      email: 'noinvite@example.com',
      lowercase_email: 'noinvite@example.com',
      disabled: false,
      apps: {
        [appName]: {
          app_attributes: {},
          disabled: false,
          is_user: false,
          roles: [],
          invite: { open: false },
        },
      },
    });
  await expect(
    createDatabaseUser({
      adapterUserData: { email: 'noinvite@example.com', emailVerified: null },
      appName,
      collectionNames,
      inviteRequired: true,
      mongoClient,
    })
  ).rejects.toThrow('Access denied.');
});

test('createDatabaseUser throws Access denied for a disabled contact', async () => {
  await mongoClient.db().collection(collectionNames.contacts).insertOne({
    _id: 'disabled-contact',
    email: 'disabled@example.com',
    lowercase_email: 'disabled@example.com',
    disabled: true,
    apps: {},
  });
  await expect(
    createDatabaseUser({
      adapterUserData: { email: 'disabled@example.com', emailVerified: null },
      appName,
      collectionNames,
      inviteRequired: false,
      mongoClient,
    })
  ).rejects.toThrow('Access denied.');
});

test('getUserFromDbByEmail looks up by lowercase email and requires app membership', async () => {
  await mongoClient
    .db()
    .collection(collectionNames.contacts)
    .insertMany([
      {
        _id: 'app-user',
        email: 'App.User@Example.com',
        lowercase_email: 'app.user@example.com',
        disabled: false,
        apps: { [appName]: { app_attributes: {}, disabled: false, is_user: true, roles: [] } },
      },
      {
        _id: 'other-app-user',
        email: 'other@example.com',
        lowercase_email: 'other@example.com',
        disabled: false,
        apps: { 'other-app': { app_attributes: {}, disabled: false, is_user: true, roles: [] } },
      },
    ]);
  const user = await getUserFromDbByEmail({
    appName,
    collectionNames,
    mongoClient,
    email: 'APP.USER@example.com',
  });
  expect(user).toMatchObject({ id: 'app-user', email: 'App.User@Example.com' });
  const notAppUser = await getUserFromDbByEmail({
    appName,
    collectionNames,
    mongoClient,
    email: 'other@example.com',
  });
  expect(notAppUser).toBe(null);
});

test('getUserFromDbById returns null for disabled or removed contacts', async () => {
  await mongoClient
    .db()
    .collection(collectionNames.contacts)
    .insertMany([
      {
        _id: 'disabled-app-user',
        email: 'a@example.com',
        lowercase_email: 'a@example.com',
        disabled: false,
        apps: { [appName]: { app_attributes: {}, disabled: true, is_user: true, roles: [] } },
      },
      {
        _id: 'removed-user',
        email: 'b@example.com',
        lowercase_email: 'b@example.com',
        disabled: false,
        removed: true,
        apps: { [appName]: { app_attributes: {}, disabled: false, is_user: true, roles: [] } },
      },
    ]);
  expect(
    await getUserFromDbById({ appName, collectionNames, mongoClient, userId: 'disabled-app-user' })
  ).toBe(null);
  expect(
    await getUserFromDbById({ appName, collectionNames, mongoClient, userId: 'removed-user' })
  ).toBe(null);
});

test('transformContactToAdapterUser maps contact fields to the adapter user shape', async () => {
  const user = await transformContactToAdapterUser({
    appName,
    contact: {
      _id: 'contact-id',
      email: 'shape@example.com',
      email_verified: null,
      image: 'image-url',
      profile: { name: 'Shape' },
      global_attributes: { theme: 'dark' },
      apps: { [appName]: { app_attributes: { plan: 'pro' }, roles: ['user'] } },
    },
  });
  expect(user).toEqual({
    id: 'contact-id',
    app_attributes: { plan: 'pro' },
    email: 'shape@example.com',
    emailVerified: null,
    image: 'image-url',
    profile: { name: 'Shape' },
    roles: ['user'],
    global_attributes: { theme: 'dark' },
  });
});
