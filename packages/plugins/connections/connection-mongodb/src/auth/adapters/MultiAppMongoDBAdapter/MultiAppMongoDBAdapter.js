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

import createDatabaseUser from './createDatabaseUser.js';
import getUserFromDbByEmail from './getUserFromDbByEmail.js';
import getUserFromDbById from './getUserFromDbById.js';
import updateDatabaseUser from './updateDatabaseUser.js';
import getClient from '../../../connections/MongoDBCollection/getClient.js';

function from({ _id, ...data }) {
  return { id: _id, ...data };
}

function to({ id, ...data }) {
  return { _id: id, ...data };
}

function MultiAppMongoDBAdapter({ properties }) {
  const { appName, collections, databaseUri, mongoDBClientOptions } = properties;
  // Resolved per operation: getClient evicts failed connects, so the operation after
  // a failed first connect connects afresh instead of reusing a dead client.
  function getMongoClient() {
    return getClient({ databaseUri, options: mongoDBClientOptions });
  }
  const collectionNames = {
    accounts: collections?.accounts ?? 'user-accounts',
    contacts: collections?.contacts ?? 'user-contacts',
    sessions: collections?.sessions ?? 'user-sessions',
    verificationTokens: collections?.verificationTokens ?? 'user-verification-tokens',
  };

  return {
    async createUser(adapterUserData) {
      const mongoClient = await getMongoClient();
      return createDatabaseUser({
        adapterUserData,
        appName,
        collectionNames,
        inviteRequired: properties.invite?.required,
        mongoClient,
      });
    },

    async getUser(userId) {
      const mongoClient = await getMongoClient();
      return getUserFromDbById({ appName, collectionNames, mongoClient, userId });
    },

    async getUserByEmail(email) {
      const mongoClient = await getMongoClient();
      return getUserFromDbByEmail({ appName, collectionNames, mongoClient, email });
    },

    async getUserByAccount(provider_providerAccountId) {
      const mongoClient = await getMongoClient();
      const account = await mongoClient
        .db()
        .collection(collectionNames.accounts)
        .findOne(provider_providerAccountId);
      if (!account) return null;

      return getUserFromDbById({ appName, collectionNames, mongoClient, userId: account.userId });
    },

    async updateUser(adapterUserData) {
      const mongoClient = await getMongoClient();
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
      const mongoClient = await getMongoClient();
      await mongoClient.db().collection(collectionNames.accounts).insertOne(to(account));
      return from(account);
    },

    async unlinkAccount(provider_providerAccountId) {
      const mongoClient = await getMongoClient();
      const account = await mongoClient
        .db()
        .collection(collectionNames.accounts)
        .findOneAndDelete(provider_providerAccountId);
      return from(account);
    },

    async getSessionAndUser(sessionToken) {
      const mongoClient = await getMongoClient();
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
      const mongoClient = await getMongoClient();
      await mongoClient.db().collection(collectionNames.sessions).insertOne(to(session));
      return session;
    },

    async updateSession(data) {
      const mongoClient = await getMongoClient();
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
      const mongoClient = await getMongoClient();
      const session = await mongoClient.db().collection(collectionNames.sessions).findOneAndDelete({
        sessionToken,
      });
      return from(session);
    },

    async createVerificationToken(data) {
      const mongoClient = await getMongoClient();
      const tokens = Array.from({ length: properties?.verificationTokens?.uses ?? 1 }, () =>
        to(data)
      );
      await mongoClient.db().collection(collectionNames.verificationTokens).insertMany(tokens);
      return data;
    },

    async useVerificationToken(identifier_token) {
      const mongoClient = await getMongoClient();
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
