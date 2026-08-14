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

import createDatabaseUser from './createDatabaseUser.js';
import getUserFromDbByEmail from './getUserFromDbByEmail.js';
import getUserFromDbById from './getUserFromDbById.js';
import updateDatabaseUser from './updateDatabaseUser.js';

function from({ _id, ...data }) {
  return { id: _id, ...data };
}

function to({ id, ...data }) {
  return { _id: id, ...data };
}

function MultiAppMongoDBAdapter({ properties }) {
  const { appName, collections, databaseUri, mongoDBClientOptions } = properties;
  const mongoClient = new MongoClient(databaseUri, mongoDBClientOptions);
  const collectionNames = {
    accounts: collections?.accounts ?? 'user-accounts',
    contacts: collections?.contacts ?? 'user-contacts',
    sessions: collections?.sessions ?? 'user-sessions',
    verificationTokens: collections?.verificationTokens ?? 'user-verification-tokens',
  };

  return {
    async createUser(adapterUserData) {
      return createDatabaseUser({
        adapterUserData,
        appName,
        collectionNames,
        inviteRequired: properties.invite?.required,
        mongoClient,
      });
    },

    async getUser(userId) {
      return getUserFromDbById({ appName, collectionNames, mongoClient, userId });
    },

    async getUserByEmail(email) {
      return getUserFromDbByEmail({ appName, collectionNames, mongoClient, email });
    },

    async getUserByAccount(provider_providerAccountId) {
      const account = await mongoClient
        .db()
        .collection(collectionNames.accounts)
        .findOne(provider_providerAccountId);
      if (!account) return null;

      return getUserFromDbById({ appName, collectionNames, mongoClient, userId: account.userId });
    },

    async updateUser(adapterUserData) {
      await updateDatabaseUser({ adapterUserData, collectionNames, mongoClient });
      return adapterUserData;
    },

    // This is not yet implemented by Auth.js
    // and we want to set a disabled flag, not delete users
    // async deleteUser(userId) {
    //   await Promise.all([
    //     db.accounts.deleteMany({ userId }),
    //     db.sessions.deleteMany({ userId }),
    //     deleteDatabaseUser({ userId }),
    //   ]);
    // },

    async linkAccount(account) {
      await mongoClient.db().collection(collectionNames.accounts).insertOne(to(account));
      return from(account);
    },

    async unlinkAccount(provider_providerAccountId) {
      const account = await mongoClient
        .db()
        .collection(collectionNames.accounts)
        .findOneAndDelete(provider_providerAccountId);
      return from(account);
    },

    async getSessionAndUser(sessionToken) {
      // eslint-disable-next-line no-unused-vars
      const session = await mongoClient
        .db()
        .collection(collectionNames.sessions)
        .findOne({ sessionToken });
      if (!session) return null;

      const user = await getUserFromDbById({
        appName,
        collectionNames,
        mongoClient,
        userId: session.userId,
      });

      return {
        user,
        session: from(session),
      };
    },

    async createSession(session) {
      await mongoClient.db().collection(collectionNames.sessions).insertOne(to(session));
      return session;
    },

    async updateSession(data) {
      // eslint-disable-next-line no-unused-vars
      const { _id, ...session } = to(data);

      const result = await mongoClient
        .db()
        .collection(collectionNames.sessions)
        .findOneAndUpdate(
          { sessionToken: session.sessionToken },
          { $set: session },
          { returnDocument: 'after' }
        );
      return from(result);
    },

    async deleteSession(sessionToken) {
      const session = await mongoClient.db().collection(collectionNames.sessions).findOneAndDelete({
        sessionToken,
      });
      return from(session);
    },

    async createVerificationToken(data) {
      const tokens = Array.from({ length: properties?.verificationTokens?.uses ?? 1 }, () =>
        to(data)
      );
      await mongoClient.db().collection(collectionNames.verificationTokens).insertMany(tokens);
      return data;
    },

    async useVerificationToken(identifier_token) {
      const verificationToken = await mongoClient
        .db()
        .collection(collectionNames.verificationTokens)
        .findOneAndDelete(identifier_token);

      if (!verificationToken) return null;
      return from(verificationToken);
    },
  };
}

export default MultiAppMongoDBAdapter;
